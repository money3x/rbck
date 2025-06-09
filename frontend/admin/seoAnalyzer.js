// seoAnalyzer.js

// Backlinks Analyzer Class
export class BacklinksAnalyzer {
    constructor() {
        this.weights = {
            quantity: 0.3,
            quality: 0.4,
            diversity: 0.2,
            anchor: 0.1
        };
    }

    analyzeBacklinks(post) {
        const mockBacklinks = this.generateMockBacklinks(post);
        
        return {
            total: mockBacklinks.length,
            dofollow: mockBacklinks.filter(b => b.dofollow).length,
            nofollow: mockBacklinks.filter(b => !b.dofollow).length,
            domains: this.getUniqueDomains(mockBacklinks),
            quality: this.analyzeBacklinkQuality(mockBacklinks),
            anchors: this.analyzeAnchorTexts(mockBacklinks),
            issues: this.findBacklinkIssues(mockBacklinks),
            score: this.calculateBacklinkScore(mockBacklinks)
        };
    }

    generateMockBacklinks(post) {
        const backlinks = [];
        const domains = [
            { domain: 'facebook.com', authority: 95, type: 'social' },
            { domain: 'twitter.com', authority: 94, type: 'social' },
            { domain: 'thairath.co.th', authority: 85, type: 'news' },
            { domain: 'khaosod.co.th', authority: 80, type: 'news' },
            { domain: 'sanook.com', authority: 88, type: 'portal' }
        ];

        const baseBacklinks = Math.floor(Math.random() * 15) + 5;
        
        for (let i = 0; i < baseBacklinks; i++) {
            const randomDomain = domains[Math.floor(Math.random() * domains.length)];
            
            backlinks.push({
                id: i + 1,
                domain: randomDomain.domain,
                domainAuthority: randomDomain.authority,
                pageAuthority: Math.floor(Math.random() * 30) + randomDomain.authority - 20,
                url: `https://${randomDomain.domain}/some-page-${i}`,
                anchorText: post.titleTH || 'บทความ',
                dofollow: Math.random() > 0.3,
                type: randomDomain.type,
                firstSeen: new Date(),
                status: 'active'
            });
        }

        return backlinks;
    }

    getUniqueDomains(backlinks) {
        const domains = [...new Set(backlinks.map(b => b.domain))];
        return {
            count: domains.length,
            list: domains,
            diversity: domains.length / backlinks.length
        };
    }

    analyzeBacklinkQuality(backlinks) {
        return {
            highAuthority: backlinks.filter(b => b.domainAuthority >= 80).length,
            mediumAuthority: backlinks.filter(b => b.domainAuthority >= 50 && b.domainAuthority < 80).length,
            lowAuthority: backlinks.filter(b => b.domainAuthority < 50).length,
            avgDomainAuthority: Math.round(backlinks.reduce((sum, b) => sum + b.domainAuthority, 0) / backlinks.length),
            avgPageAuthority: Math.round(backlinks.reduce((sum, b) => sum + b.pageAuthority, 0) / backlinks.length)
        };
    }

    analyzeAnchorTexts(backlinks) {
        const anchorCounts = {};
        backlinks.forEach(backlink => {
            anchorCounts[backlink.anchorText] = (anchorCounts[backlink.anchorText] || 0) + 1;
        });

        const sortedAnchors = Object.entries(anchorCounts)
            .sort(([,a], [,b]) => b - a)
            .map(([anchor, count]) => ({
                text: anchor,
                count,
                percentage: Math.round((count / backlinks.length) * 100)
            }));

        return {
            distribution: sortedAnchors,
            exactMatch: sortedAnchors.filter(a => a.percentage > 30),
            branded: sortedAnchors.filter(a => a.text.includes('ระเบียบการช่าง')),
            generic: sortedAnchors.filter(a => ['คลิกที่นี่', 'อ่านต่อ', 'เว็บไซต์'].includes(a.text))
        };
    }

    findBacklinkIssues(backlinks) {
        const issues = [];

        if (backlinks.length < 5) {
            issues.push({
                severity: 'high',
                type: 'quantity',
                message: `Backlinks น้อยมาก (${backlinks.length}) - ต้องสร้างเพิ่ม`
            });
        }

        return issues;
    }

    calculateBacklinkScore(backlinks) {
        if (backlinks.length === 0) return 0;

        let score = 0;
        const quantityScore = Math.min(25, backlinks.length * 2);
        score += quantityScore;

        const avgDA = backlinks.reduce((sum, b) => sum + b.domainAuthority, 0) / backlinks.length;
        const qualityScore = Math.min(40, (avgDA / 100) * 40);
        score += qualityScore;

        return Math.round(score);
    }
}

// Realistic SEO Analyzer Class
export class RealisticSeoAnalyzer {
    constructor() {
        this.weights = {
            technical: 0.25,
            content: 0.25,
            performance: 0.15,
            ux: 0.10,
            backlinks: 0.25
        };
        
        this.backlinkAnalyzer = new BacklinksAnalyzer();
    }

    analyzePost(post) {
        const analysis = {
            technical: this.analyzeTechnical(post),
            content: this.analyzeContent(post),
            performance: this.analyzePerformance(post),
            ux: this.analyzeUX(post),
            backlinks: this.analyzeBacklinks(post)
        };

        const weightedScore = Object.keys(analysis).reduce((total, category) => {
            return total + (analysis[category].score * this.weights[category]);
        }, 0);

        const totalIssues = Object.values(analysis).reduce((sum, cat) => sum + cat.issues.length, 0);
        const penaltyScore = Math.min(totalIssues * 1.5, 12);
        const finalScore = Math.max(0, Math.round(weightedScore - penaltyScore));

        return {
            totalScore: finalScore,
            grade: this.getGrade(finalScore),
            details: analysis,
            competitionLevel: this.estimateCompetition(post)
        };
    }

    analyzeTechnical(post) {
        const issues = [];
        let score = 85;

        if (!post.titleTH) {
            issues.push({ severity: 'critical', message: 'ขาด Title Tag (ส่งผลต่อ ranking มาก)' });
            score -= 25;
        } else {
            const titleLength = post.titleTH.length;
            if (titleLength < 30) {
                issues.push({ severity: 'high', message: `Title สั้นเกินไป (${titleLength} ตัวอักษร)` });
                score -= 15;
            } else if (titleLength > 60) {
                issues.push({ severity: 'high', message: `Title ยาวเกินไป (${titleLength} ตัวอักษร)` });
                score -= 12;
            }
        }

        if (!post.metaDescription) {
            issues.push({ severity: 'high', message: 'ขาด Meta Description - CTR จะต่ำ' });
            score -= 20;
        }

        return {
            score: Math.max(0, score),
            issues,
            category: 'Technical SEO'
        };
    }

    analyzeContent(post) {
        const issues = [];
        let score = 80;

        const contentText = this.stripHtml(post.content || '');
        const wordCount = contentText.split(/\s+/).filter(word => word.length > 0).length;

        if (wordCount < 300) {
            issues.push({ severity: 'critical', message: `เนื้อหาสั้นมาก (${wordCount} คำ)` });
            score -= 30;
        } else if (wordCount < 500) {
            issues.push({ severity: 'high', message: `เนื้อหาสั้น (${wordCount} คำ)` });
            score -= 15;
        }

        if (!post.focusKeyword) {
            issues.push({ severity: 'high', message: 'ไม่มี Focus Keyword' });
            score -= 18;
        }

        return {
            score: Math.max(0, score),
            issues,
            category: 'Content Quality',
            metrics: { 
                wordCount, 
                keywordDensity: post.focusKeyword ? '2.5%' : 'N/A'
            }
        };
    }

    analyzePerformance(post) {
        const issues = [];
        let score = 75;

        return {
            score: Math.max(0, score),
            issues,
            category: 'Performance'
        };
    }

    analyzeUX(post) {
        const issues = [];
        let score = 70;

        if (!post.category) {
            issues.push({ severity: 'low', message: 'ไม่มีหมวดหมู่' });
            score -= 8;
        }

        if (!post.excerpt) {
            issues.push({ severity: 'medium', message: 'ไม่มี Excerpt' });
            score -= 10;
        }

        return {
            score: Math.max(0, score),
            issues,
            category: 'User Experience'
        };
    }

    analyzeBacklinks(post) {
        const backlinkData = this.backlinkAnalyzer.analyzeBacklinks(post);
        const issues = backlinkData.issues;
        const score = backlinkData.score;

        return {
            score,
            issues,
            category: 'Backlinks & Authority',
            metrics: {
                totalBacklinks: backlinkData.total,
                referringDomains: backlinkData.domains.count,
                avgDomainAuthority: backlinkData.quality.avgDomainAuthority,
                dofollowRatio: Math.round((backlinkData.dofollow / backlinkData.total) * 100) + '%'
            },
            detailed: backlinkData
        };
    }

    getGrade(score) {
        if (score >= 90) return { grade: 'A+', color: '#28a745', description: 'ยอดเยี่ยม' };
        if (score >= 80) return { grade: 'A', color: '#28a745', description: 'ดีมาก' };
        if (score >= 70) return { grade: 'B+', color: '#20c997', description: 'ดี' };
        if (score >= 60) return { grade: 'B', color: '#ffc107', description: 'พอใช้' };
        if (score >= 50) return { grade: 'C+', color: '#fd7e14', description: 'ต้องปรับปรุง' };
        if (score >= 40) return { grade: 'C', color: '#dc3545', description: 'แย่' };
        return { grade: 'F', color: '#6f42c1', description: 'แย่มาก' };
    }

    estimateCompetition(post) {
        const factors = [];
        let competition = 'ปานกลาง';
        
        if (post.focusKeyword) {
            const keywordWords = post.focusKeyword.split(' ').length;
            if (keywordWords === 1) {
                factors.push('คำค้นหาสั้น = แข่งขันสูง');
                competition = 'สูง';
            } else if (keywordWords >= 3) {
                factors.push('Long-tail keyword = แข่งขันต่ำ');
                competition = 'ต่ำ';
            }
        }

        return { level: competition, factors };
    }

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }
}