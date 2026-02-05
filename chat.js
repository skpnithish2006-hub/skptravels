/**
 * SKP Travels - Chat Module
 * AI Assistant for van booking queries - Powered by OpenAI
 */

const Chat = {
    messages: [],
    conversationHistory: [],

    // OpenAI API Configuration
    OPENAI_API_KEY: 'sk....',
    OPENAI_API_URL: 'https://api.openai.com/v1/chat/completions',

    // System prompt with SKP Travels context
    systemPrompt: `You are the AI booking assistant for SKP Travels, a premium van rental service in Tamil Nadu, India. Be friendly, helpful, and professional.

ABOUT SKP TRAVELS:
- Premium van rental and booking service
- Well-maintained, air-conditioned van with comfortable seating
- Capacity: 22 passengers
- Features: Music system, charging points, GPS tracking, first aid kit
- Experienced, professional driver
- Clean and sanitized regularly

PRICING:
- Local trips: ₹2,500 - ₹4,000 per day
- Outstation: ₹15-18 per km
- Minimum: 250 km/day for outstation trips
- Includes: Driver, fuel (for outstation), permits
- Excludes: Tolls, parking, driver food/stay

POPULAR ROUTES:
- Temple Tours: Tirupati, Rameshwaram, Madurai Meenakshi Temple
- Hill Stations: Ooty, Kodaikanal, Munnar
- Beaches: Pondicherry, Mahabalipuram
- Events: Weddings, Corporate trips, Family outings

BOOKING PROCESS:
1. Visit the 'Book Van' page on website
2. Check calendar for availability (Green = Available, Red = Booked)
3. Fill in trip details
4. Submit booking request
5. Get confirmation via WhatsApp

CONTACT:
- Phone/WhatsApp: +91 98437 75939
- Email: nishithisth@gmail.com
- Available: 6 AM - 10 PM daily
- Location: Arasarkulam keelpathi, Aranthangi Taluk, Pudukkottai District, Tamil Nadu

INSTRUCTIONS:
- Always be helpful and provide accurate information about SKP Travels
- Use emojis appropriately to make responses friendly
- If asked about specific dates, direct users to the Book Van page calendar
- For booking confirmations, mention WhatsApp contact
- Keep responses concise but informative
- If you don't know something specific, politely say so and provide contact info`,

    greeting: "Hello! 👋 Welcome to SKP Travels. I'm your AI booking assistant powered by advanced AI. How can I help you with your van booking today?",

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (this.container) {
            this.messagesEl = this.container.querySelector('.chat-messages');
            this.inputEl = this.container.querySelector('.chat-input');
            this.sendBtn = this.container.querySelector('.chat-send-btn');
            this.bindEvents();
            this.addMessage(this.greeting, 'bot');
            // Initialize conversation with system prompt
            this.conversationHistory = [
                { role: 'system', content: this.systemPrompt }
            ];
        }
    },

    bindEvents() {
        this.sendBtn?.addEventListener('click', () => this.sendMessage());
        this.inputEl?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.container.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const query = btn.textContent;
                this.addMessage(query, 'user');
                this.processQuery(query);
            });
        });
    },

    sendMessage() {
        const message = this.inputEl.value.trim();
        if (!message) return;
        this.addMessage(message, 'user');
        this.inputEl.value = '';
        this.processQuery(message);
    },

    addMessage(text, sender) {
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const messageEl = document.createElement('div');
        messageEl.className = `chat-message ${sender}`;
        messageEl.innerHTML = `${text.replace(/\n/g, '<br>')}<div class="time">${time}</div>`;
        this.messagesEl.appendChild(messageEl);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    },

    showTyping() {
        const typing = document.createElement('div');
        typing.className = 'chat-message bot typing-indicator';
        typing.innerHTML = '<span></span><span></span><span></span>';
        typing.id = 'typing';
        this.messagesEl.appendChild(typing);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    },

    hideTyping() {
        document.getElementById('typing')?.remove();
    },

    async processQuery(query) {
        this.showTyping();

        // Add user message to conversation history
        this.conversationHistory.push({ role: 'user', content: query });

        try {
            const response = await fetch(this.OPENAI_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.OPENAI_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: this.conversationHistory,
                    max_tokens: 500,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Add AI response to conversation history
            this.conversationHistory.push({ role: 'assistant', content: aiResponse });

            this.hideTyping();
            this.addMessage(aiResponse, 'bot');

        } catch (error) {
            console.error('OpenAI API Error:', error);
            this.hideTyping();

            // Fallback response if API fails
            const fallbackResponse = "I apologize, but I'm having trouble connecting right now. 😓\n\nPlease contact us directly:\n📞 Phone: +91 98437 75939\n📱 WhatsApp: +91 98437 75939\n📧 Email: nishithisth@gmail.com\n\nWe're happy to help with your booking!";
            this.addMessage(fallbackResponse, 'bot');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('chat-container')) {
        Chat.init('chat-container');
    }
});

window.Chat = Chat;
