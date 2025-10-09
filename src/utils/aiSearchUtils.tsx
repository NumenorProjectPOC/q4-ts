// src/utils/aiSearchUtils.ts

import { AISearchResponse, StockData } from '../context/AIWebSocketContext';

type CurrentTab = 'visualization' | 'monitoring' | 'dashboard' | undefined;

// This function simulates the backend AI response based on keywords and the current tab.
export const getStaticAISearchResponse = (query: string, currentTab: CurrentTab): AISearchResponse | null => {
    const lowerCaseQuery = query.toLowerCase().trim();

    // Define keywords for different topics
    const crimeKeywords = ['dubai crime', 'crime rate', 'uae crime'];
    const safKeywords = ['oil impact', 'saf production', 'saf', 'sustainable aviation fuel', 'oil'];

    // Case 1: Dubai Crime queries
    if (crimeKeywords.some(keyword => lowerCaseQuery.includes(keyword))) {
        const responseMessage: StockData = {
            name: "dubai-crime-rate",
            guid: "a1eb2634-6763-4af4-92d3-146f0e7c7154",
            context: currentTab === 'visualization' ? 'model' : 'stock', // context depends on the tab
        };
        return {
            status: 'completed',
            stockResults: [responseMessage],
            errorMessage: ''
        };
    }

    // Case 2: Oil / SAF queries
    if (safKeywords.some(keyword => lowerCaseQuery.includes(keyword))) {
        const responseMessage: StockData = {
            name: "uae-saf-production",
            guid: "438e8995-aa03-437b-8b2d-392eaba2e808",
            context: currentTab === 'visualization' ? 'model' : 'stock', // context depends on the tab
        };
        return {
            status: 'completed',
            stockResults: [responseMessage],
            errorMessage: ''
        };
    }

    // Case 3: Any other query
    // Return null to indicate that this is a generic query that should show a delay message.
    return null;
};