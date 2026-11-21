const { Logger } = require('../utils/logger');
const { AITextService } = require('../utils/ai-text-service');

class ScriptWriterAgent {
  constructor(db, credentials) {
    this.db = db;
    this.credentials = credentials;
    this.logger = new Logger('ScriptWriter');
    this.templates = this.loadTemplates();
    this.aiTextService = new AITextService(credentials?.credentials || credentials || {});
  }

  async initialize() {
    this.logger.info('Initializing Script Writer Agent...');
    return true;
  }

  loadTemplates() {
    return {
      tutorial: {
        structure: ['hook', 'introduction', 'problem', 'solution_steps', 'demonstration', 'recap', 'cta'],
        tone: 'educational',
        pacing: 'moderate'
      },
      explainer: {
        structure: ['hook', 'question', 'background', 'explanation', 'examples', 'implications', 'summary', 'cta'],
        tone: 'informative',
        pacing: 'steady'
      },
      list: {
        structure: ['hook', 'introduction', 'list_items', 'bonus_item', 'summary', 'cta'],
        tone: 'engaging',
        pacing: 'quick'
      },
      review: {
        structure: ['hook', 'introduction', 'overview', 'pros', 'cons', 'comparison', 'verdict', 'cta'],
        tone: 'analytical',
        pacing: 'detailed'
      },
      story: {
        structure: ['hook', 'setup', 'conflict', 'journey', 'climax', 'resolution', 'lesson', 'cta'],
        tone: 'narrative',
        pacing: 'dynamic'
      }
    };
  }

  async generateScript(strategy) {
    try {
      this.logger.info(`Generating script for: ${strategy.topic}`);
      
      const channelProfile = (this.db.getChannelProfile ? await this.db.getChannelProfile() : null) || {};
      const approvedLearnings = (this.db.listLearningRecommendations ? await this.db.listLearningRecommendations({ status: 'approved' }) : []) || [];
      const snapshots = (this.db.listPerformanceSnapshots ? await this.db.listPerformanceSnapshots({ reliableOnly: false, limit: 5 }) : []) || [];
      const retentionSnapshots = (this.db.listRetentionSnapshots ? await this.db.listRetentionSnapshots({ limit: 3 }) : []) || [];

      // Extract retention curve signals and historical metrics
      let hookDropOffHigh = false;
      let averageRetention = 0;
      let averageViewDuration = 0;

      if (snapshots.length > 0) {
        const retentions = snapshots.map(s => Number(s.metrics?.retention || 0)).filter(r => r > 0);
        if (retentions.length > 0) {
          averageRetention = retentions.reduce((a, b) => a + b, 0) / retentions.length;
        }
        const avds = snapshots.map(s => Number(s.metrics?.averageViewDuration || 0)).filter(d => d > 0);
        if (avds.length > 0) {
          averageViewDuration = avds.reduce((a, b) => a + b, 0) / avds.length;
        }
      }

      if (retentionSnapshots.length > 0) {
        for (const snap of retentionSnapshots) {
          const scene0 = snap.sceneMetrics?.[0];
          if (scene0 && Number(scene0.dropOffPercent || 0) > 30) {
            hookDropOffHigh = true;
            break;
          }
          if (snap.points && snap.points.length >= 2) {
            const earlyDrop = 1 - (Number(snap.points[1].audienceWatchRatio) || 1);
            if (earlyDrop > 0.3) {
              hookDropOffHigh = true;
              break;
            }
          }
        }
      }

      // Check if any approved or recent learning recommends tighter hooks or pacing
      const hookLearning = approvedLearnings.find(l =>
        l.category === 'hookLength' || l.category === 'retention' ||
        (l.proposedChange?.prefer && String(l.proposedChange.prefer).includes('hook'))
      );
      if (hookLearning || (averageRetention > 0 && averageRetention < 40)) {
        hookDropOffHigh = true;
      }

      const learningContext = {
        channelProfile,
        approvedLearnings,
        snapshots,
        retentionSnapshots,
        hookDropOffHigh,
        averageRetention,
        averageViewDuration
      };

      const template = this.templates[strategy.contentType.toLowerCase()] || this.templates.explainer;
      const aiScript = await this.generateScriptWithAI(strategy, template, learningContext);
      if (aiScript) {
        aiScript.fullScript = this.formatFullScript(aiScript);
        await this.db.saveScript(aiScript);
        this.logger.info(`Script generated with AI provider: ${aiScript.title}`);
        return aiScript;
      }
      
      this.logger.info('Using template script generation with channel persona and learnings');
      // Generate script components
      const hook = await this.generateHook(strategy, channelProfile, learningContext);
      const introduction = await this.generateIntroduction(strategy, channelProfile, learningContext);
      const mainContent = await this.generateMainContent(strategy, template, learningContext);
      const conclusion = await this.generateConclusion(strategy, channelProfile, learningContext);
      const cta = await this.generateCTA(strategy, channelProfile, learningContext);

      // Assemble complete script
      const script = {
        title: await this.generateTitle(strategy),
        hook,
        introduction,
        mainContent,
        conclusion,
        callToAction: cta,
        duration: this.estimateDuration(mainContent),
        tone: template.tone,
        pacing: template.pacing,
        keywords: strategy.keywords || [],
        claims: [],
        metadata: {
          strategy: strategy,
          generatedAt: new Date().toISOString(),
          version: '1.0'
        }
      };

      // Format for readability
      script.fullScript = this.formatFullScript(script);
      
      // Save to database
      await this.db.saveScript(script);
      
      this.logger.info(`Script generated: ${script.title}`);
      return script;
    } catch (error) {
      this.logger.error('Failed to generate script:', error);
      throw error;
    }
  }

  async generateScriptWithAI(strategy, template, learningContext = {}) {
    if (!this.aiTextService.isAvailable()) {
      this.logger.info('Using template script generation because no AI text provider is configured');
      return null;
    }

    const channelProfile = learningContext.channelProfile || {};
    const channelName = channelProfile.channel_name || 'BunnyTales Studio';
    const brandVoice = channelProfile.brand_voice || strategy.brandVoice || 'Curious, warm, and adventurous storytelling presented by our 3D cartoon Bunny Explorer';
    const visualStyle = channelProfile.visual_style || '3D Pixar/DreamWorks-style cinematic animation featuring the Bunny Explorer';

    let learningDirectives = '';
    if (learningContext.hookDropOffHigh) {
      learningDirectives += '\n- RETENTION LEARNING (HIGH PRIORITY): Historical analytics show viewer drop-off in early seconds. Make the opening hook an ultra-compelling 5-8 second cold-open mystery or bold question with ZERO generic fluff or greetings.';
    }
    if (learningContext.approvedLearnings?.length) {
      learningDirectives += '\n- APPROVED PERFORMANCE LEARNINGS:\n' + learningContext.approvedLearnings.map(l => `  * ${l.title}: ${l.rationale}`).join('\n');
    }

    const prompt = `You are writing a YouTube script plan for the channel "${channelName}".
Narrator Persona: ${brandVoice}
Visual Style: ${visualStyle}
Return only valid JSON with this exact shape:
{
  "title": "compelling title under 100 characters",
  "hook": "opening hook in one sentence",
  "sections": [
    { "title": "section title", "content": ["spoken script bullet"], "duration": 60 }
  ],
  "cta": "clear call to action",
  "claims": [
    { "text": "specific factual claim a reviewer must verify", "riskLevel": "standard|high", "sourceUrls": ["exact supplied source URL"] }
  ]
}

Topic: ${strategy.topic}
Style/content type: ${strategy.contentType}
Angle: ${strategy.angle}
Target audience: ${strategy.targetAudience}
Desired length: ${strategy.requestedLength || process.env.DEFAULT_VIDEO_LENGTH || '8-12 minutes'}
Tone: ${template.tone}
Pacing: ${template.pacing}
Brand voice: ${brandVoice}
Channel goal: ${strategy.channelGoal || channelProfile.goal || 'entertain and educate curious viewers'}
Channel value proposition: ${strategy.channelValueProposition || 'bring history and science to life with captivating visual storytelling'}
Editorial rationale: ${strategy.planRationale || 'fit the selected topic and audience'}
Channel constraints: ${strategy.channelConstraints || 'none beyond the factual-safety rules below'}
Preferred call to action: ${strategy.callToAction || channelProfile.call_to_action || 'invite the viewer to subscribe'}
Keywords: ${(strategy.keywords || []).join(', ')}
Research sources: ${JSON.stringify(strategy.researchSources || [])}
Optimization Directives:${learningDirectives || '\n- Deliver high engagement, curiosity-driven pacing, and visual storytelling.'}
Avoid fabricated statistics, unsupported claims, and fake urgency. List every externally verifiable factual claim in claims. Use only exact URLs from Research sources; use an empty sourceUrls array when the supplied sources do not support a claim.`;

    try {
      const response = await this.aiTextService.generateText(prompt, {
        maxTokens: 1800,
        temperature: 0.7
      });
      const parsed = this.parseAIJsonResponse(response);
      const sections = this.normalizeAISections(parsed.sections, strategy);

      if (!parsed.title || !parsed.hook || sections.length === 0) {
        throw new Error('AI script response missing required fields');
      }

      this.logger.info(`Using AI script generation via ${this.aiTextService.providerName}`);
      return {
        title: String(parsed.title).slice(0, 100),
        hook: this.normalizeAIHook(parsed.hook),
        introduction: await this.generateIntroduction(strategy, channelProfile, learningContext),
        mainContent: {
          sections,
          totalDuration: this.calculateSectionsDuration(sections)
        },
        conclusion: await this.generateConclusion(strategy, channelProfile, learningContext),
        callToAction: this.normalizeAICTA(parsed.cta, strategy),
        duration: this.estimateDuration({ sections }),
        tone: template.tone,
        pacing: template.pacing,
        keywords: strategy.keywords || [],
        claims: this.normalizeAIClaims(parsed.claims, strategy.researchSources || []),
        metadata: {
          strategy,
          generatedAt: new Date().toISOString(),
          version: '1.0',
          generationSource: 'ai',
          learningsApplied: learningContext.approvedLearnings?.length || 0
        }
      };
    } catch (error) {
      this.logger.warn(`AI script generation failed; using template fallback: ${error.message}`);
      return null;
    }
  }

  parseAIJsonResponse(response) {
    const text = String(response || '').trim();
    const withoutFences = text
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      return JSON.parse(withoutFences);
    } catch (error) {
      const match = withoutFences.match(/\{[\s\S]*\}/);
      if (!match) {
        throw error;
      }
      return JSON.parse(match[0]);
    }
  }

  normalizeAIHook(hook) {
    const text = typeof hook === 'object' && hook !== null ? hook.text : hook;
    return {
      type: 'ai',
      text: String(text).trim(),
      duration: '0:00-0:05'
    };
  }

  normalizeAISections(sections, strategy) {
    if (!Array.isArray(sections)) {
      return [];
    }

    return sections
      .slice(0, 8)
      .map((section, index) => {
        const rawContent = Array.isArray(section.content)
          ? section.content
          : [section.content || section.summary || section.description];
        const content = rawContent
          .filter(Boolean)
          .map(line => String(line).trim())
          .filter(Boolean);

        return {
          type: 'ai_generated',
          title: String(section.title || `${strategy.topic} Part ${index + 1}`).trim(),
          content,
          duration: parseInt(section.duration, 10) || 60
        };
      })
      .filter(section => section.title && section.content.length > 0);
  }

  normalizeAIClaims(claims, sources) {
    if (!Array.isArray(claims)) return [];
    const allowedUrls = new Set((sources || []).map(source => source.url));
    return claims.slice(0, 25).map(item => ({
      text: String(item?.text || item?.claim || '').trim().slice(0, 1000),
      riskLevel: item?.riskLevel === 'high' ? 'high' : 'standard',
      sourceUrls: [...new Set((Array.isArray(item?.sourceUrls) ? item.sourceUrls : [])
        .map(url => String(url))
        .filter(url => allowedUrls.has(url)))]
    })).filter(item => item.text);
  }

  normalizeAICTA(cta, strategy) {
    if (cta && typeof cta === 'object') {
      return {
        type: 'call_to_action',
        subscribe: String(cta.subscribe || cta.text || `Subscribe for more on ${strategy.topic}.`),
        like: String(cta.like || 'Like this video if it helped.'),
        comment: String(cta.comment || `Share your experience with ${strategy.topic} in the comments.`),
        nextVideo: String(cta.nextVideo || 'Watch the next related video for more context.'),
        duration: '15 seconds'
      };
    }

    return {
      type: 'call_to_action',
      subscribe: String(cta || `Subscribe for more practical videos about ${strategy.topic}.`),
      like: 'Like this video if it helped.',
      comment: `Share your experience with ${strategy.topic} in the comments.`,
      nextVideo: 'Watch the next related video for more context.',
      duration: '15 seconds'
    };
  }
  async generateTitle(strategy) {
    const templates = [
      `${strategy.angle}`,
      `${strategy.topic}: The Complete Guide`,
      `Everything You Need to Know About ${strategy.topic}`,
      `${strategy.topic} in ${new Date().getFullYear()}: What's Changed?`,
      `The Truth About ${strategy.topic} (Shocking Results)`,
      `How to Master ${strategy.topic} in 30 Days`,
      `${strategy.topic}: Beginner to Expert Guide`
    ];

    // Select based on content type
    if (strategy.contentType === 'Tutorial') {
      return `How to ${strategy.topic}: Step-by-Step Guide`;
    } else if (strategy.contentType === 'List') {
      return `Top 10 ${strategy.topic} Tips You Need to Know`;
    } else if (strategy.contentType === 'Review') {
      return `${strategy.topic} Review: Is It Worth It?`;
    }

    return templates[Math.floor(Math.random() * templates.length)];
  }

  async generateHook(strategy, channelProfile = {}, learningContext = {}) {
    const isBunnyPersona = channelProfile.channel_name === 'BunnyTales Studio' || String(channelProfile.brand_voice || '').includes('Bunny');

    // If analytics show early hook drop-off, prioritize ultra-fast cold open questions (<6 seconds)
    if (learningContext?.hookDropOffHigh) {
      const coldOpenHooks = [
        {
          type: 'cold_open_mystery',
          text: `How did ancient builders conquer ${strategy.topic} without a single piece of modern machinery?`
        },
        {
          type: 'cold_open_challenge',
          text: `What if the biggest secret behind ${strategy.topic} was hidden in plain sight for thousands of years?`
        },
        {
          type: 'cold_open_question',
          text: `Have you ever wondered how people survived and solved ${strategy.topic} long before electricity?`
        }
      ];
      const selectedCold = coldOpenHooks[Math.floor(Math.random() * coldOpenHooks.length)];
      return {
        type: selectedCold.type,
        text: selectedCold.text,
        duration: '0:00-0:05'
      };
    }

    const hooks = [
      {
        type: 'question',
        text: `Have you ever wondered ${this.generateQuestionAbout(strategy.topic, isBunnyPersona)}?`
      },
      {
        type: 'statistic',
        text: `Did you know that ${this.generateStatistic(strategy.topic, isBunnyPersona)}?`
      },
      {
        type: 'statement',
        text: `${strategy.topic} is one of the most fascinating marvels in history, and here's why...`
      },
      {
        type: 'challenge',
        text: `Most people think they know the story behind ${strategy.topic}, but the real engineering secrets will blow your mind.`
      },
      {
        type: 'promise',
        text: `In the next few minutes, we're going to uncover the genius, mystery, and history of ${strategy.topic}.`
      }
    ];

    const selected = hooks[Math.floor(Math.random() * hooks.length)];
    
    return {
      type: selected.type,
      text: selected.text,
      duration: '0:00-0:05'
    };
  }

  generateQuestionAbout(topic, isBunnyPersona = false) {
    const questions = isBunnyPersona ? [
      `how ancient civilizations mastered ${topic} without modern tools`,
      `what really happened behind the scenes of ${topic}`,
      `why ${topic} remains one of the greatest engineering feats ever created`,
      `how ancient inventors figured out ${topic} centuries ahead of their time`,
      `what secrets of ${topic} are still being discovered today`
    ] : [
      `why ${topic} is becoming so important`,
      `how ${topic} actually works`,
      `what makes ${topic} different from everything else`,
      `why experts are talking about ${topic}`,
      `how ${topic} could change your life`
    ];
    
    return questions[Math.floor(Math.random() * questions.length)];
  }

  generateStatistic(topic, isBunnyPersona = false) {
    const stats = isBunnyPersona ? [
      `${topic} relied on ingenious physics and gravity that baffled modern engineers for centuries`,
      `ancient builders completed ${topic} with millimeter precision using only simple stone tools`,
      `the principles discovered in ${topic} laid the blueprint for modern civil engineering`,
      `civilizations invested decades of human labor to build ${topic} for millions of residents`,
      `archaeologists are still discovering hidden aqueducts, tunnels, and mechanisms powering ${topic}`
    ] : [
      `many people are still figuring out how ${topic} works`,
      `the conversation around ${topic} keeps expanding`,
      `experts continue to debate where ${topic} is headed`,
      `people often miss the practical side of ${topic}`,
      `${topic} can be easier to approach with a clear framework`
    ];
    
    return stats[Math.floor(Math.random() * stats.length)];
  }

  async generateIntroduction(strategy, channelProfile = {}, _learningContext = {}) {
    const channelName = channelProfile.channel_name || 'BunnyTales Studio';
    const isBunnyPersona = channelName === 'BunnyTales Studio' || String(channelProfile.brand_voice || '').includes('Bunny');

    return {
      greeting: isBunnyPersona
        ? `Hey fellow explorers, welcome back to ${channelName}!`
        : `Hey everyone, welcome back to ${channelName}!`,
      topicIntro: isBunnyPersona
        ? `Grab your explorer hat, because today we are uncovering the incredible story of ${strategy.topic}.`
        : `Today, we're diving deep into ${strategy.topic}.`,
      valueProposition: `By the end of this video, you'll understand exactly ${this.getValueProposition(strategy)}.`,
      credibility: this.getCredibilityStatement(strategy, isBunnyPersona),
      duration: '0:05-0:20'
    };
  }

  getValueProposition(strategy) {
    const propositions = {
      'Tutorial': `how to implement ${strategy.topic} step by step`,
      'Explainer': `what ${strategy.topic} is and why it matters`,
      'List': `the most important things about ${strategy.topic}`,
      'Review': `whether ${strategy.topic} is right for you`,
      'Story': `the incredible journey and secrets of ${strategy.topic}`
    };
    
    return propositions[strategy.contentType] || `the true story behind ${strategy.topic}`;
  }

  getCredibilityStatement(_strategy, isBunnyPersona = false) {
    const statements = isBunnyPersona ? [
      "Examining ancient blueprints, archaeological records, and historical evidence",
      "Based on classical archaeological records and modern engineering reconstructions",
      "Tracing the historical timelines and discoveries left behind by ancient builders",
      "Using real archaeological data from the world's greatest historical expeditions",
      "Drawing from ancient texts and architectural marvels surviving today"
    ] : [
      "I've spent months researching this topic",
      "After working with hundreds of people on this",
      "Based on the latest research and data",
      "Drawing from real-world experience",
      "Using proven methods and strategies"
    ];
    
    return statements[Math.floor(Math.random() * statements.length)];
  }

  async generateMainContent(strategy, template) {
    const sections = [];
    
    for (const section of template.structure) {
      if (!['hook', 'introduction', 'cta'].includes(section)) {
        sections.push(await this.generateSection(section, strategy));
      }
    }
    
    return {
      sections,
      totalDuration: this.calculateSectionsDuration(sections)
    };
  }

  async generateSection(sectionType, strategy) {
    const sectionGenerators = {
      problem: () => this.generateProblemSection(strategy),
      solution_steps: () => this.generateSolutionSteps(strategy),
      demonstration: () => this.generateDemonstration(strategy),
      explanation: () => this.generateExplanation(strategy),
      examples: () => this.generateExamples(strategy),
      list_items: () => this.generateListItems(strategy),
      pros: () => this.generatePros(strategy),
      cons: () => this.generateCons(strategy),
      comparison: () => this.generateComparison(strategy),
      implications: () => this.generateImplications(strategy)
    };

    const generator = sectionGenerators[sectionType];
    
    if (generator) {
      return await generator();
    }
    
    return this.generateGenericSection(sectionType, strategy);
  }

  async generateProblemSection(strategy) {
    return {
      type: 'problem',
      title: 'The Challenge',
      content: [
        `Many people struggle with ${strategy.topic}.`,
        `The main issues are:`,
        `1. Lack of clear information`,
        `2. Complexity and confusion`,
        `3. Not knowing where to start`,
        `But don't worry, we're going to solve all of these today.`
      ],
      visuals: ['Problem illustration', 'Statistics graphic'],
      duration: 30
    };
  }

  async generateSolutionSteps(strategy) {
    const steps = [];
    const numSteps = 3 + Math.floor(Math.random() * 3); // 3-5 steps
    
    for (let i = 1; i <= numSteps; i++) {
      steps.push({
        number: i,
        title: `Step ${i}: ${this.generateStepTitle(strategy.topic, i)}`,
        description: this.generateStepDescription(strategy.topic, i),
        tip: this.generateProTip(strategy.topic)
      });
    }
    
    return {
      type: 'solution_steps',
      title: 'The Solution',
      steps,
      duration: steps.length * 45
    };
  }

  generateStepTitle(topic, stepNumber) {
    const titles = [
      'Research and Preparation',
      'Setting Up the Foundation',
      'Implementation and Execution',
      'Testing and Optimization',
      'Scaling and Automation'
    ];
    
    return titles[stepNumber - 1] || `Advanced ${topic} Techniques`;
  }

  generateStepDescription(topic, _stepNumber) {
    return `This step involves understanding the key aspects of ${topic} and how to apply them effectively. Pay special attention to the details here, as they make all the difference.`;
  }

  generateProTip(_topic) {
    const tips = [
      `Pro tip: Start small and scale gradually`,
      `Remember: Consistency is more important than perfection`,
      `Quick tip: Document everything as you go`,
      `Expert advice: Focus on one aspect at a time`,
      `Insider secret: This works best when combined with regular practice`
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  }

  async generateDemonstration(_strategy) {
    return {
      type: 'demonstration',
      title: 'Live Demo',
      content: [
        `Now let me show you exactly how this works.`,
        `[Screen recording or visual demonstration]`,
        `As you can see, the process is straightforward once you understand the basics.`,
        `The key is to follow the steps exactly as shown.`
      ],
      visuals: ['Screen recording', 'Step-by-step graphics'],
      duration: 120
    };
  }

  async generateExplanation(strategy) {
    return {
      type: 'explanation',
      title: 'Deep Dive',
      content: [
        `Let's break down ${strategy.topic} into its core components.`,
        `First, we need to understand the fundamental principles.`,
        `The science behind this is fascinating...`,
        `[Detailed explanation with visuals]`,
        `This is why ${strategy.topic} works so effectively.`
      ],
      visuals: ['Diagrams', 'Infographics', 'Charts'],
      duration: 90
    };
  }

  async generateExamples(strategy) {
    return {
      type: 'examples',
      title: 'Real-World Examples',
      content: [
        `Let's look at some real examples of ${strategy.topic} in action.`,
        `Example 1: [Specific case study]`,
        `Example 2: [Another relevant example]`,
        `Example 3: [Third compelling example]`,
        `These examples show the versatility and power of ${strategy.topic}.`
      ],
      visuals: ['Case study graphics', 'Before/after comparisons'],
      duration: 75
    };
  }

  async generateListItems(strategy) {
    const items = [];
    const numItems = 5 + Math.floor(Math.random() * 6); // 5-10 items
    
    for (let i = 1; i <= numItems; i++) {
      items.push({
        number: numItems - i + 1, // Countdown for engagement
        title: this.generateListItemTitle(strategy.topic, i),
        description: this.generateListItemDescription(strategy.topic),
        impact: this.generateImpactStatement()
      });
    }
    
    return {
      type: 'list_items',
      title: `Top ${numItems} Things About ${strategy.topic}`,
      items,
      duration: items.length * 30
    };
  }

  generateListItemTitle(topic, index) {
    const titles = [
      `The Hidden Power of ${topic}`,
      `Why ${topic} Matters More Than You Think`,
      `The Surprising Truth About ${topic}`,
      `How ${topic} Can Transform Your Approach`,
      `The ${topic} Secret Nobody Talks About`,
      `Mastering ${topic} in Record Time`,
      `The Ultimate ${topic} Hack`,
      `${topic}: The Game Changer`,
      `Breaking Down ${topic} Myths`,
      `The Future of ${topic}`
    ];
    
    return titles[index - 1] || `Advanced ${topic} Technique #${index}`;
  }

  generateListItemDescription(topic) {
    return `This aspect of ${topic} is crucial because it fundamentally changes how we approach the subject. Understanding this will give you a significant advantage.`;
  }

  generateImpactStatement() {
    const impacts = [
      'This alone can save you hours',
      'Game-changing for beginners',
      'Essential for long-term success',
      'Often overlooked but critical',
      'The difference between success and failure'
    ];
    
    return impacts[Math.floor(Math.random() * impacts.length)];
  }

  async generatePros(_strategy) {
    return {
      type: 'pros',
      title: 'The Benefits',
      points: [
        'Easy to get started',
        'Cost-effective solution',
        'Proven results',
        'Scalable approach',
        'Community support'
      ],
      duration: 45
    };
  }

  async generateCons(_strategy) {
    return {
      type: 'cons',
      title: 'Things to Consider',
      points: [
        'Learning curve at the beginning',
        'Requires consistent effort',
        'Results may vary',
        'Some technical knowledge helpful'
      ],
      duration: 30
    };
  }

  async generateComparison(strategy) {
    return {
      type: 'comparison',
      title: 'How It Compares',
      content: `Compared to alternatives, ${strategy.topic} stands out because of its unique approach and proven effectiveness.`,
      comparisonPoints: [
        'More efficient than traditional methods',
        'Better ROI than competitors',
        'Easier to implement',
        'More sustainable long-term'
      ],
      duration: 60
    };
  }

  async generateImplications(strategy) {
    return {
      type: 'implications',
      title: 'What This Means',
      content: [
        `The implications of ${strategy.topic} are far-reaching.`,
        'This will change how we think about the industry.',
        'Early adopters will have a significant advantage.',
        'The potential for growth is enormous.'
      ],
      duration: 45
    };
  }

  generateGenericSection(sectionType, strategy) {
    return {
      type: sectionType,
      title: sectionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      content: `This section covers important aspects of ${strategy.topic} that you need to know.`,
      duration: 60
    };
  }

  async generateConclusion(strategy, channelProfile = {}, _learningContext = {}) {
    const isBunnyPersona = channelProfile.channel_name === 'BunnyTales Studio' || String(channelProfile.brand_voice || '').includes('Bunny');

    if (isBunnyPersona) {
      return {
        type: 'conclusion',
        title: 'The Explorer’s Verdict',
        recap: [
          `And that is the astonishing truth behind ${strategy.topic}!`,
          'From sheer human willpower to ancient ingenuity, here is what we discovered:',
          `- How ancient builders overcame seemingly impossible odds to master ${strategy.topic}`,
          `- The hidden engineering secrets that kept ancient cities thriving`,
          `- Why the techniques behind ${strategy.topic} still inspire modern science`
        ],
        finalThought: `Every stone, aqueduct, and ancient blueprint proves that human curiosity knows no bounds. Keep exploring!`,
        duration: '30 seconds'
      };
    }

    return {
      type: 'conclusion',
      title: 'Wrapping Up',
      recap: [
        `So that's everything you need to know about ${strategy.topic}.`,
        'We covered the key points:',
        '- The fundamentals and why they matter',
        '- Practical steps to get started',
        '- Real-world applications and examples',
        '- Tips for long-term success'
      ],
      finalThought: `Remember, ${strategy.topic} is a journey, not a destination. Keep learning and improving!`,
      duration: '30 seconds'
    };
  }

  async generateCTA(strategy, channelProfile = {}, _learningContext = {}) {
    const isBunnyPersona = channelProfile.channel_name === 'BunnyTales Studio' || String(channelProfile.brand_voice || '').includes('Bunny');

    if (isBunnyPersona) {
      return {
        type: 'call_to_action',
        subscribe: channelProfile.call_to_action || "Subscribe to BunnyTales Studio and hit the notification bell for more thrilling animated adventures into history and science!",
        like: "Give this video a thumbs up if you enjoyed exploring with our Bunny Explorer today!",
        comment: `What ancient wonder, civilization, or mystery should our Bunny Explorer investigate next? Share your ideas in the comments below!`,
        nextVideo: "Click the video on your screen right now for our next deep dive adventure!",
        duration: '15 seconds'
      };
    }

    return {
      type: 'call_to_action',
      subscribe: channelProfile.call_to_action || "If you found this helpful, make sure to subscribe and hit the notification bell!",
      like: "Give this video a thumbs up if you learned something new.",
      comment: `Let me know in the comments: What's your experience with ${strategy.topic}?`,
      nextVideo: "Check out this related video for more insights.",
      duration: '15 seconds'
    };
  }

  formatFullScript(script) {
    let fullScript = '';
    
    // Title
    fullScript += `TITLE: ${script.title}\n\n`;
    fullScript += '═'.repeat(50) + '\n\n';
    
    // Hook
    fullScript += `[${script.hook.duration}] HOOK\n`;
    fullScript += `${script.hook.text}\n\n`;
    
    // Introduction
    fullScript += `[${script.introduction.duration}] INTRODUCTION\n`;
    fullScript += `${script.introduction.greeting}\n`;
    fullScript += `${script.introduction.topicIntro}\n`;
    fullScript += `${script.introduction.valueProposition}\n`;
    fullScript += `${script.introduction.credibility}\n\n`;
    
    // Main Content
    fullScript += 'MAIN CONTENT\n';
    fullScript += '─'.repeat(30) + '\n\n';
    
    for (const section of script.mainContent.sections) {
      fullScript += `[${this.formatDuration(section.duration)}] ${section.title.toUpperCase()}\n`;
      
      if (Array.isArray(section.content)) {
        section.content.forEach(line => {
          fullScript += `${line}\n`;
        });
      } else if (section.steps) {
        section.steps.forEach(step => {
          fullScript += `\n${step.title}\n`;
          fullScript += `${step.description}\n`;
          fullScript += `💡 ${step.tip}\n`;
        });
      } else if (section.items) {
        section.items.forEach(item => {
          fullScript += `\n#${item.number}: ${item.title}\n`;
          fullScript += `${item.description}\n`;
          fullScript += `Impact: ${item.impact}\n`;
        });
      } else if (section.points) {
        section.points.forEach(point => {
          fullScript += `• ${point}\n`;
        });
      } else {
        fullScript += `${section.content}\n`;
      }
      
      if (section.visuals) {
        fullScript += `\n[VISUALS: ${section.visuals.join(', ')}]\n`;
      }
      
      fullScript += '\n';
    }
    
    // Conclusion
    fullScript += `[${script.conclusion.duration}] CONCLUSION\n`;
    script.conclusion.recap.forEach(line => {
      fullScript += `${line}\n`;
    });
    fullScript += `\n${script.conclusion.finalThought}\n\n`;
    
    // Call to Action
    fullScript += `[${script.callToAction.duration}] CALL TO ACTION\n`;
    fullScript += `${script.callToAction.subscribe}\n`;
    fullScript += `${script.callToAction.like}\n`;
    fullScript += `${script.callToAction.comment}\n`;
    fullScript += `${script.callToAction.nextVideo}\n\n`;
    
    // Metadata
    fullScript += '═'.repeat(50) + '\n';
    fullScript += `ESTIMATED DURATION: ${script.duration}\n`;
    fullScript += `TONE: ${script.tone}\n`;
    fullScript += `PACING: ${script.pacing}\n`;
    fullScript += `KEYWORDS: ${(script.keywords || []).join(', ')}\n`;
    
    return fullScript;
  }

  estimateDuration(mainContent) {
    const totalSeconds = mainContent.sections.reduce((total, section) => {
      return total + (section.duration || 60);
    }, 0);
    
    // Add hook, intro, conclusion, CTA
    const fullDuration = totalSeconds + 5 + 15 + 30 + 15;
    
    return this.formatDuration(fullDuration);
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  calculateSectionsDuration(sections) {
    return sections.reduce((total, section) => total + (section.duration || 60), 0);
  }
}

module.exports = { ScriptWriterAgent };
