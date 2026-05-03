import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.feature_extraction.text import TfidfVectorizer

# Download required NLTK data on first run
try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')

stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_and_preprocess(text: str) -> str:
    \"\"\"
    Cleans text by removing special characters, lowercasing,
    tokenizing, removing stopwords, and lemmatizing.
    \"\"\"
    if not text:
        return ""
        
    # Lowercase
    text = text.lower()
    
    # Remove non-alphabetical characters
    text = re.sub(r'[^a-z\s]', '', text)
    
    # Tokenize (simple split to avoid dependency on punkt if possible, but let's just split)
    tokens = text.split()
    
    # Remove stopwords and lemmatize
    processed_tokens = [
        lemmatizer.lemmatize(word)
        for word in tokens
        if word not in stop_words
    ]
    
    return " ".join(processed_tokens)

def train_tfidf(corpus: list[str]) -> TfidfVectorizer:
    \"\"\"
    Trains and returns a TF-IDF vectorizer on the given corpus.
    \"\"\"
    vectorizer = TfidfVectorizer()
    vectorizer.fit(corpus)
    return vectorizer

def vectorize_texts(texts: list[str], vectorizer: TfidfVectorizer):
    \"\"\"
    Vectorizes a list of strings using the provided vectorizer.
    \"\"\"
    return vectorizer.transform(texts)
