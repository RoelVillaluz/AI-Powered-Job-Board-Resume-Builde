import { registry } from "./registry";

/**
 * Fluent builder returned by Factory(name).
 * Provides a chainable API for configuring and executing factory calls.
 *
 * Do not instantiate directly — use the Factory() function instead.
 *
 * @class FactoryBuilder
 *
 * @example
 * // Unit test — plain object, no DB
 * const data = await Factory('job').as('senior').build();
 *
 * // Integration test — persists to DB
 * const user = await Factory('user').as('employer').for(User).create();
 *
 * // Multiple documents
 * const jobs = await Factory('job').with({ company: id }).for(JobPosting).createList(5);
 */
class FactoryBuilder {
  /** @type {string} */
  #name;

  /** @type {Object} */
  #overrides = {};

  /** @type {string[]} */
  #traits = [];

  /** @type {mongoose.Model|null} */
  #Model = null;

  /**
   * @param {string} name - Registered factory name
   */
  constructor(name) {
    this.#name = name;
  }

  /**
   * Merges field-level overrides into the factory output.
   * Can be called multiple times — each call is merged cumulatively.
   *
   * @param {Object} overrides - Partial object to merge over factory defaults
   * @returns {FactoryBuilder} `this` for chaining
   *
   * @example
   * Factory('job').with({ company: companyId }).with({ status: 'Closed' })
   */
  with(overrides) {
    this.#overrides = { ...this.#overrides, ...overrides };
    return this;
  }

  /**
   * Applies one or more named traits defined on the factory.
   * Traits are merged after defaults but before overrides.
   *
   * @param {...string} traits - Trait names to apply
   * @returns {FactoryBuilder} `this` for chaining
   *
   * @example
   * Factory('user').as('employer')
   * Factory('job').as('senior', 'remote')
   */
  as(...traits) {
    this.#traits = traits;
    return this;
  }

  /**
   * Binds a Mongoose model for use with .create() and .createList().
   * Must be called before any method that persists to the DB.
   *
   * @param {mongoose.Model} Model - Mongoose model to persist documents with
   * @returns {FactoryBuilder} `this` for chaining
   *
   * @example
   * Factory('user').for(User).create()
   */
  for(Model) {
    this.#Model = Model;
    return this;
  }

  /**
   * Builds a plain object from the factory — no DB interaction.
   * Use this for unit tests and shape assertions.
   *
   * @returns {Promise<Object>}
   *
   * @example
   * const jobData = await Factory('job').as('senior').build();
   */
  async build() {
    return registry.build(this.#name, this.#overrides, this.#traits);
  }

  /**
   * Builds and persists a single document to the DB.
   * Requires .for(Model) to be called first.
   *
   * @returns {Promise<mongoose.Document>}
   * @throws {Error} If .for(Model) was not called
   *
   * @example
   * const user = await Factory('user').as('employer').for(User).create();
   */
  async create() {
    if (!this.#Model) throw new Error(`Call .for(Model) before .create() on factory "${this.#name}"`);
    return registry.create(this.#name, this.#Model, this.#overrides, this.#traits);
  }

  /**
   * Builds `n` plain objects — no DB interaction.
   * Per-item overrides can be passed as an array aligned by index.
   *
   * @param {number} n - Number of objects to build
   * @param {Object[]} [listOverrides=[]] - Optional per-item overrides (index-aligned)
   * @returns {Promise<Object[]>}
   *
   * @example
   * const jobs = await Factory('job').buildList(3);
   * const jobs = await Factory('job').buildList(3, [{ status: 'Closed' }, {}, {}]);
   */
  async buildList(n, listOverrides = []) {
    return Promise.all(
      Array.from({ length: n }, (_, i) =>
        registry.build(this.#name, { ...this.#overrides, ...(listOverrides[i] ?? {}) }, this.#traits)
      )
    );
  }

  /**
   * Builds and persists `n` documents to the DB.
   * Requires .for(Model) to be called first.
   * Per-item overrides can be passed as an array aligned by index.
   *
   * @param {number} n - Number of documents to create
   * @param {Object[]} [listOverrides=[]] - Optional per-item overrides (index-aligned)
   * @returns {Promise<mongoose.Document[]>}
   * @throws {Error} If .for(Model) was not called
   *
   * @example
   * const users = await Factory('user').for(User).createList(5);
   * const jobs  = await Factory('job').for(JobPosting).createList(3, [
   *   { status: 'Closed' }, {}, {}
   * ]);
   */
  async createList(n, listOverrides = []) {
    if (!this.#Model) throw new Error(`Call .for(Model) before .createList() on factory "${this.#name}"`);
    return Promise.all(
      Array.from({ length: n }, (_, i) =>
        registry.create(this.#name, this.#Model, { ...this.#overrides, ...(listOverrides[i] ?? {}) }, this.#traits)
      )
    );
  }
}

/**
 * Entry point for the fluent factory API.
 * Returns a configured FactoryBuilder for the given factory name.
 *
 * @param {string} name - Registered factory name (e.g. 'user', 'job', 'skillRef')
 * @returns {FactoryBuilder}
 *
 * @example
 * await Factory('user').as('employer').for(User).create();
 * await Factory('job').with({ company: id }).build();
 */
export const Factory = (name) => new FactoryBuilder(name);