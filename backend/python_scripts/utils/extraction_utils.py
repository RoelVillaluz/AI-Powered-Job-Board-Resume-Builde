def extract_skill_names(skills: list[dict], lowercase = bool[True]) -> set[str]:
    names = {skill.get('name', '') for skill in skills if skill.get('name')}
    return {name.lower() for name in names} if lowercase else names
