import os
import joblib
from sklearn.naive_bayes import MultinomialNB
from sklearn.feature_extraction.text import TfidfVectorizer
from .text_processing import clean_and_preprocess

# A simple mock dataset for classifying project ideas into domains.
MOCK_DATASET = [
    # AI / ML
    ("machine learning model to predict house prices", "AI"),
    ("deep learning computer vision system for defect detection", "AI"),
    ("generative ai chatbot using llms", "AI"),
    ("natural language processing for sentiment analysis", "AI"),
    
    # Web Development
    ("react and fast api ecommerce website", "Web"),
    ("full stack blog platform with nextjs", "Web"),
    ("real time chat app using websockets and nodejs", "Web"),
    ("portfolio website using html css and vanilla javascript", "Web"),
    
    # HealthTech
    ("app to track daily calories and heart rate", "HealthTech"),
    ("machine learning system for detecting diseases from xrays", "HealthTech"),
    ("platform connecting doctors and patients for virtual appointments", "HealthTech"),
    
    # FinTech
    ("stock market analysis and prediction dashboard", "FinTech"),
    ("crypto wallet tracker with real time price alerts", "FinTech"),
    ("personal finance management and budget planner", "FinTech")
]

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "nb_model.pkl")
VECTORIZER_PATH = os.path.join(MODEL_DIR, "nb_vectorizer.pkl")

class ProjectClassifier:
    def __init__(self):
        self.model = None
        self.vectorizer = None
        
        # Create models directory if it doesn't exist
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.load_model()

    def train(self):
        print("Training Naive Bayes Model...")
        texts = [item[0] for item in MOCK_DATASET]
        labels = [item[1] for item in MOCK_DATASET]
        
        # Preprocess text
        cleaned_texts = [clean_and_preprocess(t) for t in texts]
        
        # Vectorize
        self.vectorizer = TfidfVectorizer()
        X = self.vectorizer.fit_transform(cleaned_texts)
        
        # Train
        self.model = MultinomialNB()
        self.model.fit(X, labels)
        
        # Save
        joblib.dump(self.model, MODEL_PATH)
        joblib.dump(self.vectorizer, VECTORIZER_PATH)
        print("Model trained and saved successfully.")

    def load_model(self):
        if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
            self.model = joblib.load(MODEL_PATH)
            self.vectorizer = joblib.load(VECTORIZER_PATH)
        else:
            self.train()

    def predict(self, text: str) -> str:
        if not self.model or not self.vectorizer:
            self.load_model()
            
        cleaned_text = clean_and_preprocess(text)
        if not cleaned_text.strip():
            return "Unknown"
            
        X = self.vectorizer.transform([cleaned_text])
        prediction = self.model.predict(X)[0]
        return prediction

# Singleton instance
classifier = ProjectClassifier()
