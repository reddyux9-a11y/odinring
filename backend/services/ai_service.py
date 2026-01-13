"""
AI Service for OdinRing
Handles AI-powered features like content generation, descriptions, and suggestions
"""
import os
import logging
from typing import Optional, Dict, Any, List
from enum import Enum

logger = logging.getLogger(__name__)

class AIProvider(str, Enum):
    """Supported AI providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    NONE = "none"

class AIService:
    """Service for AI-powered features"""
    
    def __init__(self):
        self.provider = self._detect_provider()
        self.api_key = self._get_api_key()
        self.enabled = self.provider != AIProvider.NONE and self.api_key is not None
        
        if self.enabled:
            logger.info(f"✅ AI Service initialized with provider: {self.provider}")
        else:
            logger.warning("⚠️ AI Service disabled - no API key configured")
    
    def _detect_provider(self) -> AIProvider:
        """Detect which AI provider to use based on available API keys"""
        if os.getenv("OPENAI_API_KEY"):
            return AIProvider.OPENAI
        elif os.getenv("ANTHROPIC_API_KEY"):
            return AIProvider.ANTHROPIC
        return AIProvider.NONE
    
    def _get_api_key(self) -> Optional[str]:
        """Get the API key for the configured provider"""
        if self.provider == AIProvider.OPENAI:
            return os.getenv("OPENAI_API_KEY")
        elif self.provider == AIProvider.ANTHROPIC:
            return os.getenv("ANTHROPIC_API_KEY")
        return None
    
    async def generate_link_description(self, title: str, url: str, category: str) -> Optional[str]:
        """
        Generate a description for a link based on title, URL, and category
        
        Args:
            title: Link title
            url: Link URL
            category: Link category
            
        Returns:
            Generated description or None if AI is not available
        """
        if not self.enabled:
            return None
        
        try:
            prompt = f"""Generate a short, engaging description (max 150 characters) for a link:
Title: {title}
URL: {url}
Category: {category}

Description:"""
            
            if self.provider == AIProvider.OPENAI:
                return await self._generate_with_openai(prompt, max_tokens=50)
            elif self.provider == AIProvider.ANTHROPIC:
                return await self._generate_with_anthropic(prompt, max_tokens=50)
        except Exception as e:
            logger.error(f"Failed to generate link description: {e}")
            return None
    
    async def generate_item_description(self, name: str, category: str, price: Optional[float] = None) -> Optional[str]:
        """
        Generate a description for a merchant item
        
        Args:
            name: Item name
            category: Item category (product/service/digital)
            price: Optional item price
            
        Returns:
            Generated description or None if AI is not available
        """
        if not self.enabled:
            return None
        
        try:
            price_text = f"Price: ${price:.2f}" if price else ""
            category_text = f"Category: {category}" if category else ""
            prompt = f"""Generate a compelling product/service description (max 200 characters) for:
Name: {name}
{category_text}
{price_text}

Description:"""
            
            if self.provider == AIProvider.OPENAI:
                return await self._generate_with_openai(prompt, max_tokens=80)
            elif self.provider == AIProvider.ANTHROPIC:
                return await self._generate_with_anthropic(prompt, max_tokens=80)
        except Exception as e:
            logger.error(f"Failed to generate item description: {e}")
            return None
    
    async def generate_bio(self, name: str, links: List[Dict[str, Any]], profession: Optional[str] = None) -> Optional[str]:
        """
        Generate a bio based on user's name, links, and profession
        
        Args:
            name: User's name
            links: List of user's links
            profession: Optional profession/title
            
        Returns:
            Generated bio or None if AI is not available
        """
        if not self.enabled:
            return None
        
        try:
            link_titles = ", ".join([link.get("title", "") for link in links[:5]])
            profession_text = f"Profession: {profession}" if profession else ""
            prompt = f"""Generate a professional, engaging bio (max 200 characters) for:
Name: {name}
{profession_text}
Links: {link_titles}

Bio:"""
            
            if self.provider == AIProvider.OPENAI:
                return await self._generate_with_openai(prompt, max_tokens=100)
            elif self.provider == AIProvider.ANTHROPIC:
                return await self._generate_with_anthropic(prompt, max_tokens=100)
        except Exception as e:
            logger.error(f"Failed to generate bio: {e}")
            return None
    
    async def suggest_categories(self, title: str, url: str) -> List[str]:
        """
        Suggest categories for a link based on title and URL
        
        Args:
            title: Link title
            url: Link URL
            
        Returns:
            List of suggested categories
        """
        if not self.enabled:
            return ["general"]
        
        try:
            prompt = f"""Suggest the best category for this link from: social, media, business, general, portfolio, blog, shop, music, video, podcast
Title: {title}
URL: {url}

Category (one word):"""
            
            if self.provider == AIProvider.OPENAI:
                category = await self._generate_with_openai(prompt, max_tokens=10)
                return [category.strip().lower()] if category else ["general"]
            elif self.provider == AIProvider.ANTHROPIC:
                category = await self._generate_with_anthropic(prompt, max_tokens=10)
                return [category.strip().lower()] if category else ["general"]
        except Exception as e:
            logger.error(f"Failed to suggest category: {e}")
            return ["general"]
    
    async def _generate_with_openai(self, prompt: str, max_tokens: int = 100) -> Optional[str]:
        """Generate text using OpenAI API"""
        try:
            from openai import AsyncOpenAI
            
            client = AsyncOpenAI(api_key=self.api_key)
            
            response = await client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates concise, engaging content."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
        except ImportError:
            logger.error("OpenAI library not installed. Install with: pip install openai")
            return None
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            return None
    
    async def _generate_with_anthropic(self, prompt: str, max_tokens: int = 100) -> Optional[str]:
        """Generate text using Anthropic API"""
        try:
            import anthropic
            
            client = anthropic.Anthropic(api_key=self.api_key)
            
            response = await client.messages.create(
                model="claude-3-haiku-20240307",
                max_tokens=max_tokens,
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            
            return response.content[0].text.strip()
        except ImportError:
            logger.error("Anthropic library not installed. Install with: pip install anthropic")
            return None
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            return None

# Singleton instance
_ai_service: Optional[AIService] = None

def get_ai_service() -> AIService:
    """Get the global AI service instance"""
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service

