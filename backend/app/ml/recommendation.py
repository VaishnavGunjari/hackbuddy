from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from .text_processing import clean_and_preprocess

# Mock dataset of projects to recommend
MOCK_PROJECTS = [
    {"id": 1, "title": "AI Image Generator", "description": "Generate amazing images using deep learning and GANs."},
    {"id": 2, "title": "Healthcare Chatbot", "description": "AI chatbot that gives health advice and diagnosis."},
    {"id": 3, "title": "Web3 Crypto Exchange", "description": "Decentralized crypto trading platform on Ethereum."},
    {"id": 4, "title": "React Native Fitness App", "description": "Mobile app to track fitness goals with customized plans."},
    {"id": 5, "title": "Stock Market Predictor", "description": "Machine learning model predicting stocks using historical data."}
]

class Recommender:
    def __init__(self):
        self.projects = MOCK_PROJECTS
        self.vectorizer = TfidfVectorizer()
        
        # Precompute vectors for projects
        self.project_texts = [
            clean_and_preprocess(f"{p['title']} {p['description']}") 
            for p in self.projects
        ]
        
        if self.project_texts:
            self.project_vectors = self.vectorizer.fit_transform(self.project_texts)
        else:
            self.project_vectors = None

    def recommend_projects(self, user_query: str, top_n: int = 3):
        if self.project_vectors is None or self.project_vectors.shape[0] == 0:
            return []
            
        cleaned_query = clean_and_preprocess(user_query)
        if not cleaned_query.strip():
            # Return some random or popular ones if query is empty
            return self.projects[:top_n]
            
        query_vector = self.vectorizer.transform([cleaned_query])
        
        # Compute Cosine Similarity
        similarities = cosine_similarity(query_vector, self.project_vectors).flatten()
        
        # Get top indices
        top_indices = similarities.argsort()[-top_n:][::-1]
        
        results = []
        for idx in top_indices:
            if similarities[idx] > 0: # Only return if there's some match
                result = dict(self.projects[idx])
                result['similarity_score'] = float(similarities[idx])
                results.append(result)
                
        return results

# Singleton instance
recommender = Recommender()
