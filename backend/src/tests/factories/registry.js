import mongoose from 'mongoose';

/**
 * @typedef {Object} FactoryDefinition
 * @property {function(FactoryRegistry): Promise<Object>|Object} defaults - Factory default values. Receives the registry instance for sequencing and nested builds.
 * @property {Object.<string, function(): Object>} [traits] - Named overrides. Each trait is a function returning a partial object merged over defaults.
 */

/**
 * Central registry for all factory definitions and sequence counters.
 * Holds the source of truth for what every factory produces.
 *
 * @class FactoryRegistry
 *
 * @example
 * registry.define('user', {
 *   defaults: (r) => ({ email: `user+${r.seq('user')}@example.com` }),
 *   traits: { admin: () => ({ role: 'admin' }) }
 * });
 *
 * await registry.build('user');
 * await registry.build('user', { email: 'custom@example.com' }, ['admin']);
 */
class FactoryRegistry {
  #factories = new Map();
  #sequences = new Map();

  /**
   * Registers a factory definition under a given name.
   * Calling define() twice with the same name overwrites the previous definition.
   *
   * @param {string} name - Factory identifier (e.g. 'user', 'skillRef')
   * @param {FactoryDefinition} definition - Factory definition object
   * @returns {FactoryRegistry} Returns `this` for optional method chaining
   */
  define(name, definition) {
    this.#factories.set(name, definition);
    return this;
  }

  /**
   * Increments and returns the next value in a named sequence.
   * Used to generate unique field values (e.g. emails, names) across test runs.
   *
   * @param {string} name - Sequence identifier (e.g. 'user', 'company')
   * @param {function(number): *} [fn] - Optional transform applied to the counter. Defaults to identity.
   * @returns {*} The current sequence value after incrementing
   *
   * @example
   * r.seq('user')           // → 1, 2, 3, ...
   * r.seq('user', i => `user_${i}`) // → 'user_1', 'user_2', ...
   */
  seq(name, fn = (i) => i) {
    const count = (this.#sequences.get(name) ?? 0) + 1;
    this.#sequences.set(name, count);
    return fn(count);
  }

  /**
   * Generates a new Mongoose ObjectId.
   * Convenience wrapper used in ref factory defaults (e.g. skillRef, locationRef).
   *
   * @returns {mongoose.Types.ObjectId}
   */
  newId() {
    return new mongoose.Types.ObjectId();
  }

  /**
   * Builds a plain object from a registered factory — no DB interaction.
   * Merges defaults → traits → overrides in that order.
   *
   * @param {string} name - Registered factory name
   * @param {Object} [overrides={}] - Field-level overrides merged last
   * @param {string[]} [traits=[]] - Trait names to apply after defaults
   * @returns {Promise<Object>} Plain object with all fields resolved
   * @throws {Error} If the factory name is not registered
   * @throws {Error} If a trait name does not exist on the factory
   *
   * @example
   * await registry.build('user');
   * await registry.build('user', { email: 'x@example.com' }, ['admin']);
   */
  async build(name, overrides = {}, traits = []) {
    const def = this.#factories.get(name);
    if (!def) throw new Error(`Factory "${name}" not registered`);

    const base = await def.defaults(this);
    const traitOverrides = traits.reduce((acc, trait) => {
      const fn = def.traits?.[trait];
      if (!fn) throw new Error(`Trait "${trait}" not found on factory "${name}"`);
      return { ...acc, ...fn() };
    }, {});

    return { ...base, ...traitOverrides, ...overrides };
  }

  /**
   * Builds and persists a document using a registered factory.
   * Internally calls build() then passes the result to Model.create().
   *
   * @param {string} name - Registered factory name
   * @param {mongoose.Model} Model - Mongoose model to persist the document with
   * @param {Object} [overrides={}] - Field-level overrides merged last
   * @param {string[]} [traits=[]] - Trait names to apply after defaults
   * @returns {Promise<mongoose.Document>} The created Mongoose document
   *
   * @example
   * await registry.create('user', User, { email: 'x@example.com' }, ['admin']);
   */
  async create(name, Model, overrides = {}, traits = []) {
    const data = await this.build(name, overrides, traits);
    return Model.create(data);
  }
}

export const registry = new FactoryRegistry();