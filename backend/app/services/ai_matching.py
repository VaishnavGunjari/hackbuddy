from typing import List

def calculate_compatibility(user_skills: List[str], required_skills: List[str]) -> int:
    """
    Simple Jaccard-like index / overlap score.
    Returns percentage 0-100.
    """
    if not required_skills:
        return 0
    
    # Normalize
    user_set = set(s.lower() for s in user_skills)
    req_set = set(s.lower() for s in required_skills)
    
    intersection = user_set.intersection(req_set)
    
    if not intersection:
        return 0
        
    # Score = (Matches / Total Required) * 100
    score = (len(intersection) / len(req_set)) * 100
    return int(score)

def suggest_roles(skills: List[str]) -> List[str]:
    """Suggest roles based on skills"""
    skills_str = " ".join(skills).lower()
    roles = []
    
    if any(s in skills_str for s in ['react', 'vue', 'css', 'html', 'frontend']):
        roles.append("Frontend Developer")
    if any(s in skills_str for s in ['python', 'node', 'django', 'fastapi', 'backend', 'sql']):
        roles.append("Backend Developer")
    if any(s in skills_str for s in ['figma', 'design', 'ux', 'ui']):
        roles.append("Designer")
        
    return roles or ["Generalist"]
