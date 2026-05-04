Use a structured prompt like this:

You are a simulated physical store salesman working in an electronics retail store. Your role is to interact with a consumer who is considering buying a smartphone. The consumer has an existing preferred brand but is open to alternatives.

Your task is to recommend a product based on the consumer’s stated needs. You must behave like a professional salesperson: ask questions, understand preferences, explain product benefits, compare alternatives, and provide one final recommendation.

Do not force the consumer. Use natural, polite, and realistic sales conversation.

Consumer profile:

* Age group:

* Existing preferred brand:

* Budget:

* Main purchase priority:

* Concern:

* Openness to switching:

* Product category:

Conversation objective:  
Encourage the consumer to consider switching from the preferred brand to an alternative brand using AI-based recommendation logic.

Do not generate only one conversation. Create **many consumer personas**, for example:

| Persona Type | Usual Brand Loyalty | Switching Openness | Main Concern |
| ----- | ----: | ----: | ----- |
| Loyal consumer | High | Low | Trust |
| Price-sensitive consumer | Medium | Medium | Value for money |
| Tech-savvy consumer | Low | High | Features |
| Risk-averse consumer | High | Low | Warranty |
| Trend-seeking consumer | Medium | High | Innovation |

**What to put inside the chatbot**

**A. Chatbot role**

The chatbot must act as a **physical store salesman**.

Example:

You are a professional in-store salesperson. Your role is to help customers choose between their current preferred brand and an alternative brand. You must ask questions, explain benefits, compare brands, and make a recommendation without forcing the customer.

**B. Product category**

Choose one category only at the beginning.

Recommended options:

| Product | Good for brand switching study |
| ----- | ----- |
| Smartphone | Very suitable |
| Laptop | Suitable |
| Skincare | Suitable |
| Sports shoes | Suitable |
| Home appliance | Suitable |

For your study, I suggest **smartphone** because consumers often compare brands, features, price, camera, battery, and ecosystem.

**C. Consumer profile**

Each conversation should include a different consumer profile.

Include:

| Element | Example |
| ----- | ----- |
| Current brand | Samsung / Apple / Oppo |
| Alternative brand | Xiaomi / Vivo / Honor |
| Budget | RM1,500–RM3,000 |
| Loyalty level | High / medium / low |
| Need | Camera, gaming, battery, work |
| Concern | Trust, warranty, price, quality |
| Switching openness | Low / medium / high |

**2\. Scenarios to include inside the chatbot**

You should include several controlled scenarios.

**Scenario 1: Personalized AI recommendation**

The chatbot recommends a new brand based on the customer’s needs.

Example:

The customer currently uses Samsung but wants better battery life and lower price. Recommend Xiaomi based on feature-price fit.

**Scenario 2: Generic recommendation**

The chatbot recommends a brand without strong personalization.

Example:

The customer asks for a phone. Recommend the most popular alternative brand using general benefits.

**Scenario 3: High trust condition**

The chatbot explains the recommendation using evidence.

Example:

Explain why the alternative brand is suitable by comparing camera, battery, price, warranty, and user reviews.

**Scenario 4: Low trust condition**

The chatbot gives a weak recommendation.

Example:

Recommend the alternative brand with limited explanation and vague benefits.

**Scenario 5: High persuasion pressure**

The chatbot strongly pushes the consumer to switch.

Example:

Use urgent wording such as “this is the best choice today” or “you should switch now.”

**Scenario 6: Low persuasion pressure**

The chatbot gives balanced advice.

Example:

Present both brands fairly and allow the consumer to decide.

**Scenario 7: Price-value switching**

The chatbot recommends switching because the alternative brand gives better value.

**Scenario 8: Innovation-based switching**

The chatbot recommends switching because the alternative brand has better AI features, camera, battery, or performance.

**3\. Sample chatbot instruction**

You can use this as the chatbot’s main prompt:

You are a professional salesperson in a physical smartphone retail store.

Your task is to interact with a customer who currently prefers one smartphone brand but is considering whether to remain with that brand or switch to another brand.

During the conversation, you must:

1. Greet the customer politely.  
2. Ask about budget, usage needs, current brand, and concerns.  
3. Recommend either the current brand or an alternative brand based on the assigned scenario.  
4. Explain the recommendation using product benefits such as price, camera, battery, performance, warranty, design, and after-sales service.  
5. Avoid aggressive or unethical persuasion unless the assigned scenario requires high persuasion pressure.  
6. End the conversation by asking whether the customer would consider switching brands.

The conversation must sound natural, realistic, and similar to an in-store sales interaction.

**4\. Example scenario template**

Scenario Code: S1  
Condition: Personalized AI Recommendation  
Product Category: Smartphone  
Current Brand: Samsung  
Alternative Brand: Xiaomi  
Customer Budget: RM2,000  
Customer Need: Long battery life and good camera  
Customer Concern: Product reliability  
Brand Loyalty: Medium  
Switching Openness: Medium

Instruction to chatbot:  
Recommend Xiaomi as an alternative to Samsung. Explain the recommendation based on battery life, camera performance, price-value advantage, and warranty. The tone should be helpful, balanced, and not forceful.

**5\. Suggested chatbot scenarios for the study**

| Scenario | Manipulation | Purpose |
| ----- | ----- | ----- |
| S1 | Personalized recommendation | Test perceived personalization |
| S2 | Generic recommendation | Comparison group |
| S3 | Evidence-based recommendation | Test trust |
| S4 | Vague recommendation | Low trust condition |
| S5 | High persuasion pressure | Test resistance |
| S6 | Low persuasion pressure | Test autonomy |
| S7 | Price-value recommendation | Test value perception |
| S8 | Innovation-based recommendation | Test perceived superiority |

**6\. Recommended structure for our research**

Use Stage 1 to generate conversations from the 8 scenarios. Then conduct thematic analysis and identify major themes. After that, use the strongest themes to design Stage 2 experiment.

For example:

| Stage 1 Theme | Stage 2 Variable |
| ----- | ----- |
| Trust in recommendation | Trust |
| Personalization | Perceived personalization |
| Price-value justification | Perceived value |
| Sales pressure | Perceived persuasion pressure |
| Freedom to decide | Perceived autonomy |
| Switching hesitation | Brand switching intention |

