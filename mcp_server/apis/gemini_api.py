"""
Gemini AI API client for analysis and sentiment
"""
import logging
from typing import Dict, Any, List, Optional
import google.generativeai as genai
from .base_api import BaseAPIClient
from utils import cache_result, sanitize_input

logger = logging.getLogger(__name__)

class GeminiAPIClient(BaseAPIClient):
    """Client for Gemini AI API"""
    
    def __init__(self, config):
        super().__init__(config)
        genai.configure(api_key=self.api_key)
        self.model_name = "gemini-1.5-flash"
        self.model = genai.GenerativeModel(self.model_name)
    
    def test_connection(self) -> bool:
        """Test Gemini API connection"""
        try:
            response = self.model.generate_content("Hello, this is a connection test.")
            return bool(response.text)
        except Exception as e:
            logger.error(f"Gemini API connection test failed: {e}")
            return False
    
    @cache_result(ttl=3600)  # Cache for 1 hour
    def analyze_sentiment(
        self,
        text: str,
        context: str = "trade and tariff analysis"
    ) -> Dict[str, Any]:
        """Analyze sentiment of text using Gemini AI"""
        
        if not text or not text.strip():
            return {"status": "error", "error": "Text cannot be empty"}
        
        # Limit text length to avoid token limits
        text = text[:8000]  # Rough token limit
        
        prompt = f"""
        Analyze the sentiment and key themes in the following {context} text.
        
        Provide your analysis in the following format:
        1. Overall sentiment (positive, negative, neutral)
        2. Key themes and topics (list 3-5 main themes)
        3. Potential market impacts (if applicable)
        4. Policy implications (if applicable)
        5. Summary of main findings
        
        Text to analyze:
        {text}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                "status": "success",
                "analysis": response.text,
                "text_length": len(text),
                "context": context
            }
        except Exception as e:
            logger.error(f"Gemini sentiment analysis failed: {e}")
            return {
                "status": "error",
                "error": f"Analysis failed: {str(e)}"
            }
    
    def analyze_news_sentiment(
        self,
        articles: List[Dict[str, Any]],
        query: str = "trade news"
    ) -> Dict[str, Any]:
        """Analyze sentiment of news articles"""
        
        if not articles:
            return {"status": "error", "error": "No articles provided"}
        
        # Prepare content for analysis
        content_for_analysis = []
        for article in articles[:10]:  # Limit to 10 articles
            article_text = f"""
            Title: {article.get('title', '')}
            Description: {article.get('description', '')}
            Source: {article.get('source', {}).get('name', 'Unknown')}
            Published: {article.get('published_at', '')}
            """
            content_for_analysis.append(article_text.strip())
        
        combined_content = "\n\n---\n\n".join(content_for_analysis)
        
        prompt = f"""
        Analyze the following {query} articles. Provide:
        1. Overall sentiment (positive, negative, neutral)
        2. Key themes and topics
        3. Potential market impacts
        4. Policy implications
        5. Summary of main findings
        
        News Articles:
        {combined_content}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                "status": "success",
                "query": query,
                "articles_analyzed": len(articles),
                "analysis": response.text,
                "articles": articles
            }
        except Exception as e:
            logger.error(f"Gemini news analysis failed: {e}")
            return {
                "status": "error",
                "error": f"News analysis failed: {str(e)}"
            }
    
    def analyze_policy_impact(
        self,
        policy_documents: List[Dict[str, Any]],
        product_context: str = "general trade"
    ) -> Dict[str, Any]:
        """Analyze policy documents for impact assessment"""
        
        if not policy_documents:
            return {"status": "error", "error": "No policy documents provided"}
        
        # Prepare content for analysis
        content_for_analysis = []
        for doc in policy_documents[:5]:  # Limit to 5 documents
            doc_text = f"""
            Title: {doc.get('title', '')}
            Abstract: {doc.get('abstract', '')}
            Type: {doc.get('type', '')}
            Agencies: {', '.join(doc.get('agencies', []))}
            Date: {doc.get('publication_date', '')}
            """
            content_for_analysis.append(doc_text.strip())
        
        combined_content = "\n\n---\n\n".join(content_for_analysis)
        
        prompt = f"""
        Analyze these policy documents for their impact on {product_context}. Provide:
        1. Key policy changes or announcements
        2. Affected industries and products
        3. Timeline of implementation
        4. Economic impact predictions
        5. Stakeholder reactions
        6. Overall policy direction trends
        
        Policy Documents:
        {combined_content}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                "status": "success",
                "product_context": product_context,
                "documents_analyzed": len(policy_documents),
                "analysis": response.text,
                "documents": policy_documents
            }
        except Exception as e:
            logger.error(f"Gemini policy analysis failed: {e}")
            return {
                "status": "error",
                "error": f"Policy analysis failed: {str(e)}"
            }
    
    def generate_summary(
        self,
        data: Dict[str, Any],
        summary_type: str = "comprehensive analysis"
    ) -> Dict[str, Any]:
        """Generate a summary of complex data"""
        
        if not data:
            return {"status": "error", "error": "No data provided"}
        
        # Convert data to text format
        data_text = str(data)[:6000]  # Limit size
        
        prompt = f"""
        Generate a {summary_type} based on the following data.
        
        Provide:
        1. Executive summary (key findings)
        2. Main insights and trends
        3. Important numbers and statistics
        4. Recommendations or implications
        5. Areas requiring further investigation
        
        Data:
        {data_text}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                "status": "success",
                "summary_type": summary_type,
                "summary": response.text,
                "data_size": len(str(data))
            }
        except Exception as e:
            logger.error(f"Gemini summary generation failed: {e}")
            return {
                "status": "error",
                "error": f"Summary generation failed: {str(e)}"
            }
    
    def compare_scenarios(
        self,
        scenarios: List[Dict[str, Any]],
        comparison_context: str = "tariff scenarios"
    ) -> Dict[str, Any]:
        """Compare multiple scenarios using AI analysis"""
        
        if not scenarios or len(scenarios) < 2:
            return {"status": "error", "error": "At least 2 scenarios required"}
        
        # Prepare scenario data
        scenario_text = ""
        for i, scenario in enumerate(scenarios, 1):
            scenario_text += f"""
            Scenario {i}: {scenario.get('name', f'Scenario {i}')}
            Data: {scenario}
            """
        
        prompt = f"""
        Compare the following {comparison_context} and provide:
        1. Key differences between scenarios
        2. Pros and cons of each scenario
        3. Risk assessment for each scenario
        4. Recommended scenario with justification
        5. Implementation considerations
        
        Scenarios:
        {scenario_text}
        """
        
        try:
            response = self.model.generate_content(prompt)
            
            return {
                "status": "success",
                "comparison_context": comparison_context,
                "scenarios_compared": len(scenarios),
                "analysis": response.text,
                "scenarios": scenarios
            }
        except Exception as e:
            logger.error(f"Gemini scenario comparison failed: {e}")
            return {
                "status": "error",
                "error": f"Scenario comparison failed: {str(e)}"
            }
