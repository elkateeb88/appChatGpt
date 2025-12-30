// Reddit SaaS Idea Finder - Main Application Logic

// Global state
let discoveredQuestions = [];
let analyzedOpportunities = [];

// Search patterns configuration
const searchPatterns = {
    'is there any tool': { weight: 10, category: 'tool-search' },
    'looking for': { weight: 8, category: 'need' },
    'need help with': { weight: 7, category: 'problem' },
    'anyone know': { weight: 6, category: 'discovery' },
    'recommend': { weight: 5, category: 'recommendation' },
    'alternative to': { weight: 9, category: 'competition' },
    'how do I': { weight: 4, category: 'how-to' },
    'frustrated with': { weight: 10, category: 'pain-point' }
};

// High-value keywords that indicate buying intent
const highValueKeywords = [
    'willing to pay', 'budget', 'enterprise', 'team', 'business',
    'automate', 'save time', 'every day', 'hours', 'manual',
    'hate', 'terrible', 'awful', 'broken', 'doesn\'t work',
    'need urgently', 'asap', 'deadline', 'client', 'company'
];

// Helper Functions
function setTopic(topic) {
    document.getElementById('topic').value = topic;
}

function addSubreddit(subreddit) {
    const input = document.getElementById('subreddits');
    const current = input.value.trim();
    if (current) {
        if (!current.includes(subreddit)) {
            input.value = current + ', ' + subreddit;
        }
    } else {
        input.value = subreddit;
    }
}

// Generate Google search queries
function generateSearches() {
    const topic = document.getElementById('topic').value.trim();
    if (!topic) {
        alert('الرجاء إدخال موضوع للبحث');
        return;
    }

    const selectedPatterns = [];
    document.querySelectorAll('.pattern-checkbox input:checked').forEach(checkbox => {
        selectedPatterns.push(checkbox.value);
    });

    if (selectedPatterns.length === 0) {
        alert('الرجاء اختيار نمط واحد على الأقل');
        return;
    }

    const subreddits = document.getElementById('subreddits').value.trim();
    const searchLinksContainer = document.getElementById('search-links');
    searchLinksContainer.innerHTML = '';

    // Generate search queries
    const queries = [];

    selectedPatterns.forEach(pattern => {
        let query = `site:reddit.com "${topic}" "${pattern}"`;

        // Add subreddit filter if specified
        if (subreddits) {
            const subs = subreddits.split(',').map(s => s.trim());
            subs.forEach(sub => {
                const subQuery = `site:reddit.com/${sub.replace('r/', '')} "${topic}" "${pattern}"`;
                queries.push({
                    query: subQuery,
                    pattern: pattern,
                    subreddit: sub
                });
            });
        } else {
            queries.push({
                query: query,
                pattern: pattern,
                subreddit: null
            });
        }
    });

    // Create search links
    queries.forEach((item, index) => {
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(item.query)}`;

        const linkElement = document.createElement('a');
        linkElement.className = 'search-link';
        linkElement.href = googleUrl;
        linkElement.target = '_blank';
        linkElement.innerHTML = `
            <span class="icon">🔍</span>
            <span class="query">${item.query}</span>
            <span class="arrow">←</span>
        `;

        searchLinksContainer.appendChild(linkElement);
    });

    // Add a combined search
    const combinedQuery = `site:reddit.com "${topic}" ("is there any tool" OR "looking for" OR "need help")`;
    const combinedUrl = `https://www.google.com/search?q=${encodeURIComponent(combinedQuery)}`;

    const combinedLink = document.createElement('a');
    combinedLink.className = 'search-link';
    combinedLink.href = combinedUrl;
    combinedLink.target = '_blank';
    combinedLink.style.background = 'rgba(255, 69, 0, 0.1)';
    combinedLink.style.borderColor = 'var(--primary)';
    combinedLink.innerHTML = `
        <span class="icon">⭐</span>
        <span class="query">${combinedQuery}</span>
        <span class="arrow">← بحث شامل</span>
    `;
    searchLinksContainer.appendChild(combinedLink);

    // Show results section
    document.getElementById('results-section').style.display = 'block';

    // Scroll to results
    document.getElementById('results-section').scrollIntoView({ behavior: 'smooth' });
}

// Analyze questions
function analyzeQuestions() {
    const input = document.getElementById('question-input').value.trim();
    if (!input) {
        alert('الرجاء إدخال الأسئلة للتحليل');
        return;
    }

    // Parse questions (one per line)
    const questions = input.split('\n')
        .map(q => q.trim())
        .filter(q => q.length > 10);

    if (questions.length === 0) {
        alert('لم يتم العثور على أسئلة صالحة');
        return;
    }

    // Analyze each question
    analyzedOpportunities = questions.map(question => analyzeQuestion(question));

    // Sort by score
    analyzedOpportunities.sort((a, b) => b.score - a.score);

    // Display results
    displayAnalysis(analyzedOpportunities);
}

// Analyze a single question
function analyzeQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    let score = 0;
    let matchedPatterns = [];
    let matchedKeywords = [];
    let insights = [];

    // Check for search patterns
    Object.entries(searchPatterns).forEach(([pattern, config]) => {
        if (lowerQuestion.includes(pattern.toLowerCase())) {
            score += config.weight;
            matchedPatterns.push({
                pattern: pattern,
                category: config.category
            });
        }
    });

    // Check for high-value keywords
    highValueKeywords.forEach(keyword => {
        if (lowerQuestion.includes(keyword.toLowerCase())) {
            score += 5;
            matchedKeywords.push(keyword);
        }
    });

    // Check for frustration indicators
    const frustrationWords = ['hate', 'terrible', 'awful', 'frustrated', 'annoyed', 'angry'];
    const hasFrustration = frustrationWords.some(word => lowerQuestion.includes(word));
    if (hasFrustration) {
        score += 8;
        insights.push('يوجد إحباط واضح = فرصة قوية');
    }

    // Check for buying intent
    const buyingWords = ['pay', 'budget', 'price', 'cost', 'subscription', 'enterprise'];
    const hasBuyingIntent = buyingWords.some(word => lowerQuestion.includes(word));
    if (hasBuyingIntent) {
        score += 10;
        insights.push('استعداد للدفع = عميل محتمل');
    }

    // Check for urgency
    const urgencyWords = ['urgent', 'asap', 'deadline', 'need now', 'immediately'];
    const hasUrgency = urgencyWords.some(word => lowerQuestion.includes(word));
    if (hasUrgency) {
        score += 6;
        insights.push('حاجة عاجلة = سوق نشط');
    }

    // Check for team/business context
    const businessWords = ['team', 'company', 'business', 'clients', 'employees', 'organization'];
    const isB2B = businessWords.some(word => lowerQuestion.includes(word));
    if (isB2B) {
        score += 7;
        insights.push('سياق B2B = قيمة أعلى');
    }

    // Determine score level
    let level = 'low';
    if (score >= 20) level = 'high';
    else if (score >= 10) level = 'medium';

    // Generate SaaS idea suggestion
    const saasIdea = generateSaaSIdea(question, matchedPatterns);

    return {
        question: question,
        score: score,
        level: level,
        patterns: matchedPatterns,
        keywords: matchedKeywords,
        insights: insights,
        saasIdea: saasIdea
    };
}

// Generate SaaS idea from question
function generateSaaSIdea(question, patterns) {
    const lowerQuestion = question.toLowerCase();

    // Extract potential product type
    let productType = 'أداة';
    if (lowerQuestion.includes('automate')) productType = 'نظام أتمتة';
    if (lowerQuestion.includes('dashboard')) productType = 'لوحة تحكم';
    if (lowerQuestion.includes('track')) productType = 'نظام تتبع';
    if (lowerQuestion.includes('manage')) productType = 'نظام إدارة';
    if (lowerQuestion.includes('analyze')) productType = 'أداة تحليل';
    if (lowerQuestion.includes('report')) productType = 'نظام تقارير';

    // Check for alternative requests
    const isAlternative = patterns.some(p => p.pattern === 'alternative to');
    if (isAlternative) {
        return `فرصة: بناء بديل أفضل/أرخص للأداة المذكورة`;
    }

    return `فكرة: ${productType} يحل هذه المشكلة بشكل مباشر`;
}

// Display analysis results
function displayAnalysis(opportunities) {
    // Show analysis section
    document.getElementById('analysis-section').style.display = 'block';

    // Calculate stats
    const totalQuestions = opportunities.length;
    const highOpportunities = opportunities.filter(o => o.level === 'high').length;
    const mediumOpportunities = opportunities.filter(o => o.level === 'medium').length;
    const avgScore = Math.round(opportunities.reduce((sum, o) => sum + o.score, 0) / totalQuestions);

    // Display stats
    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalQuestions}</div>
            <div class="stat-label">إجمالي الأسئلة</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: var(--success)">${highOpportunities}</div>
            <div class="stat-label">فرص عالية</div>
        </div>
        <div class="stat-card">
            <div class="stat-value" style="color: var(--warning)">${mediumOpportunities}</div>
            <div class="stat-label">فرص متوسطة</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgScore}</div>
            <div class="stat-label">متوسط النقاط</div>
        </div>
    `;

    // Display opportunities
    const opportunitiesList = document.getElementById('opportunities-list');
    opportunitiesList.innerHTML = '';

    opportunities.forEach((opp, index) => {
        const card = document.createElement('div');
        card.className = `opportunity-card ${opp.level}`;

        const tagsHtml = opp.patterns.map(p =>
            `<span class="opportunity-tag">${p.category}</span>`
        ).join('');

        const keywordsHtml = opp.keywords.map(k =>
            `<span class="opportunity-tag" style="background: rgba(70, 209, 96, 0.2); color: var(--success)">${k}</span>`
        ).join('');

        const insightsHtml = opp.insights.length > 0
            ? `<div class="opportunity-insight">💡 ${opp.insights.join(' | ')}</div>`
            : '';

        card.innerHTML = `
            <div class="opportunity-header">
                <div class="opportunity-question">${opp.question}</div>
                <div class="opportunity-score ${opp.level}">
                    ${opp.level === 'high' ? '🔥' : opp.level === 'medium' ? '⭐' : '○'}
                    ${opp.score} نقطة
                </div>
            </div>
            <div class="opportunity-tags">
                ${tagsHtml}
                ${keywordsHtml}
            </div>
            ${insightsHtml}
            <div class="opportunity-insight" style="border-right-color: var(--primary); margin-top: 10px;">
                🎯 ${opp.saasIdea}
            </div>
        `;

        opportunitiesList.appendChild(card);
    });

    // Scroll to analysis
    document.getElementById('analysis-section').scrollIntoView({ behavior: 'smooth' });
}

// Export results as JSON
function exportResults() {
    if (analyzedOpportunities.length === 0) {
        alert('لا توجد نتائج للتصدير');
        return;
    }

    const exportData = {
        exportDate: new Date().toISOString(),
        totalOpportunities: analyzedOpportunities.length,
        highPriority: analyzedOpportunities.filter(o => o.level === 'high'),
        mediumPriority: analyzedOpportunities.filter(o => o.level === 'medium'),
        lowPriority: analyzedOpportunities.filter(o => o.level === 'low'),
        allOpportunities: analyzedOpportunities
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reddit-saas-opportunities-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// Export results as CSV
function exportAsCSV() {
    if (analyzedOpportunities.length === 0) {
        alert('لا توجد نتائج للتصدير');
        return;
    }

    const headers = ['Question', 'Score', 'Level', 'Categories', 'Keywords', 'Insights', 'SaaS Idea'];
    const rows = analyzedOpportunities.map(opp => [
        `"${opp.question.replace(/"/g, '""')}"`,
        opp.score,
        opp.level,
        `"${opp.patterns.map(p => p.category).join(', ')}"`,
        `"${opp.keywords.join(', ')}"`,
        `"${opp.insights.join(' | ')}"`,
        `"${opp.saasIdea}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reddit-saas-opportunities-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('Reddit SaaS Idea Finder initialized');
});
