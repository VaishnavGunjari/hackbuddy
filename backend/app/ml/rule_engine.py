import json
import os

RULES_PATH = os.path.join(os.path.dirname(__file__), "rules.json")

class RuleEngine:
    def __init__(self):
        self.rules = self.load_rules()

    def load_rules(self):
        if not os.path.exists(RULES_PATH):
            return []
        try:
            with open(RULES_PATH, 'r') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print("Error parsing rules.json")
            return []

    def evaluate(self, user_context: dict) -> list[str]:
        """
        user_context example: {"skill_level": "beginner", "preferred_domain": "AI"}
        """
        suggestions = []
        for rule in self.rules:
            # Check if all conditions in the rule match the user context
            match = True
            for key, expected_value in rule.get("conditions", {}).items():
                if user_context.get(key) != expected_value:
                    match = False
                    break
            
            if match:
                suggestions.append(rule.get("suggestion"))
                
        return suggestions

# Singleton instance
rule_engine = RuleEngine()
