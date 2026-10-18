import { Router } from 'express';
import { dbStore } from '../db/store.ts';
import { requireAuth, type AuthenticatedRequest } from '../services/authService.ts';

const router = Router();

// Fallback Algorithmic Intelligence Generator when no external Gemini API key is provided
function generateIntelligentResponse(
  message: string,
  mode: 'practice' | 'competition',
  context?: {
    roundId?: string;
    problemId?: string;
    code?: string;
    language?: string;
    problemTitle?: string;
    error?: string;
  }
): { reply: string; suggestions: string[] } {
  const msgLower = message.toLowerCase();
  const problemTitle = context?.problemTitle || 'this problem';
  const language = context?.language || 'python';
  const code = context?.code || '';

  // In competition mode: strict academic integrity (no full solution code)
  if (mode === 'competition') {
    if (msgLower.includes('code') || msgLower.includes('solution') || msgLower.includes('give me') || msgLower.includes('write')) {
      return {
        reply: `### 🛡️ CODEQUEST Academic Integrity Policy (Competition Mode Active)\n\nDuring active competition rounds, I cannot provide direct or full solution code to ensure a fair arena for all participants.\n\nHowever, I can guide you through the **conceptual mechanics**:\n\n1. **Identify the Core Invariant**: What property remains constant across each step?\n2. **Algorithmic Archetype**: Does this problem map to:\n   - **Two Pointers / Sliding Window** (sorted arrays, contiguous subarray constraints)\n   - **Monotonic Stack** (next greater/smaller element queries in $O(N)$)\n   - **Dynamic Programming** (overlapping subproblems + optimal substructure)\n   - **Hash Map / Frequency Counter** (constant time lookup)\n3. **Target Complexity**: Aim for $O(N)$ or $O(N \\log N)$ given typical contest constraints ($N \\le 10^5$). Avoid $O(N^2)$ brute-force loops.\n\nWhich part of your logic are you currently troubleshooting?`,
        suggestions: [
          'What are the edge cases to consider?',
          'What is the ideal time & space complexity?',
          'How should I structure my base cases?',
        ],
      };
    }

    if (msgLower.includes('edge') || msgLower.includes('case') || msgLower.includes('test')) {
      return {
        reply: `### 🔍 Critical Edge Cases to Test for ${problemTitle}\n\nBefore submitting your code, verify these boundary conditions:\n\n- **Empty or Minimal Input**: Arrays of length $0$ or $1$, empty strings, or $N = 1$.\n- **Extreme Values**: Negative numbers, zero, maximum allowable integers (watch out for $32$-bit integer overflow in C++ / JS).\n- **Duplicates & Homogeneous Sets**: All elements identical (e.g. \`[0, 0, 0, 0]\`), or all elements strictly increasing / strictly decreasing.\n- **Parity & Disconnected States**: Odd vs. even lengths, disconnected components in graph traversal, or cyclic graphs.\n- **Scale & Timeouts**: Does your approach perform within the 2.0s limit when $N = 10^5$? Avoid string concatenation inside tight loops.`,
        suggestions: [
          'How do I optimize space complexity?',
          'How should I handle 0 and negative inputs?',
          'Explain the time complexity bound.',
        ],
      };
    }

    if (msgLower.includes('complexity') || msgLower.includes('time') || msgLower.includes('space') || msgLower.includes('big o')) {
      return {
        reply: `### ⏱️ Algorithmic Complexity Breakdown\n\nFor competitive programming problems of this tier:\n\n- **Target Time Complexity**: $\\mathcal{O}(N)$ or $\\mathcal{O}(N \\log N)$ is typically required to pass hidden performance benchmarks under 2000ms.\n- **Forbidden Traps**: $\\mathcal{O}(N^2)$ nested loops will hit \`TIME_LIMIT_EXCEEDED\` if $N \\ge 10^4$.\n- **Target Space Complexity**: $\\mathcal{O}(1)$ auxiliary space if in-place mutation is permissible, or $\\mathcal{O}(N)$ when using hash tables or recursion stacks.\n\n**Pro-Tip**: If you find yourself repeatedly searching in an array, replace the inner scan with a Hash Map or Frequency Map for $\\mathcal{O}(1)$ average lookups!`,
        suggestions: [
          'How can I reduce time complexity?',
          'What data structure is most optimal here?',
          'Give me a hint on the algorithm.',
        ],
      };
    }

    if (msgLower.includes('hint') || msgLower.includes('help') || msgLower.includes('stuck') || msgLower.includes('approach')) {
      return {
        reply: `### 💡 Socratic Hint for ${problemTitle}\n\n1. **Observe the Data Flow**: Break the problem into two sub-tasks: preparation and traversal.\n2. **State Transition**: If using DP, let $dp[i]$ represent the optimal answer up to index $i$. How does $dp[i]$ derive from previous states?\n3. **Greedy Choice Property**: Can you make a locally optimal choice at each step without regretting it later?\n4. **Pointer Manipulation**: If the array can be sorted or is already sorted, can two pointers moving inwards reduce your search space in single linear pass?\n\nTake a look at your current code: are you doing redundant work inside your main loop?`,
        suggestions: [
          'What are the edge cases?',
          'Can you explain the optimal data structure?',
          'How do I handle time limit exceeded?',
        ],
      };
    }

    // Default competition response
    return {
      reply: `### 🎯 CODEQUEST Socratic Guide (${mode.toUpperCase()} MODE)\n\nI'm your algorithmic co-pilot for **${problemTitle}**. \n\nIn active competition mode, I guide your problem-solving process without providing direct code solutions:\n\n- **Formulate your hypothesis**: What is your proposed approach?\n- **Analyze constraints**: Check input sizes to choose the right complexity.\n- **Verify edge cases**: Zero, negative, single-element, and maximum bounds.\n\nAsk me about **algorithmic intuition**, **time complexity optimization**, or **edge cases**!`,
      suggestions: [
        'Give me a conceptual hint',
        'What edge cases should I test?',
        'What is the expected time complexity?',
        'How can I optimize my current code?',
      ],
    };
  }

  // Practice mode: full helpful mentor
  if (msgLower.includes('roadmap') || msgLower.includes('learn') || msgLower.includes('study')) {
    return {
      reply: `### 🗺️ Competitive Programming Mastery Roadmap\n\n1. **Phase 1: Foundations (Week 1–2)**\n   - Arrays, Strings, Two Pointers, Prefix Sums, Binary Search.\n   - Master time and space complexity calculation.\n\n2. **Phase 2: Core Data Structures (Week 3–4)**\n   - Hash Maps & Sets, Stacks, Queues, Heaps/Priority Queues.\n   - Monotonic Stack techniques for range queries.\n\n3. **Phase 3: Graphs & Trees (Week 5–6)**\n   - BFS/DFS traversal, Topological Sort, Dijkstra, Union-Find (DSU).\n\n4. **Phase 4: Dynamic Programming & Math (Week 7–8)**\n   - 1D/2D DP, Knapsack variations, Bitmask DP, Number Theory.\n\n5. **Phase 5: Contest Strategy**\n   - Speed vs. Accuracy, proctoring composure, stress testing with randomized test suites.`,
      suggestions: [
        'How do I master Dynamic Programming?',
        'What are the best graph algorithms to learn?',
        'Give me tips for quiz accuracy.',
      ],
    };
  }

  return {
    reply: `### 🚀 CODEQUEST AI Assistant\n\nHello! I'm your CODEQUEST competitive programming mentor. \n\nHere is how I can support your journey:\n\n- 🧠 **Algorithmic Problem Solving**: Guidance on DP, Graphs, Greedy, Trees, and Sorting.\n- 🔍 **Code Review & Diagnostics**: Spotting off-by-one errors, memory leaks, and infinite loops.\n- 📊 **Complexity Optimization**: Scaling from $\\mathcal{O}(N^2)$ down to $\\mathcal{O}(N \\log N)$ or $\\mathcal{O}(N)$.\n- 🎓 **Round Strategy**: Managing time across Quiz, Coding, Debugging, and Final Battles.\n\nHow can I help you excel today?`,
    suggestions: [
      'Give me a hint for this problem',
      'What are common debugging traps in competitive coding?',
      'How does the qualification scoring engine work?',
      'Show me a roadmap to improve my rating',
    ],
  };
}

// 1. GET /api/ai/config - Public AI status
router.get('/config', (req, res) => {
  try {
    const config = dbStore.getAIConfig();
    const hasApiKey = Boolean(config.apiKey || process.env.GEMINI_API_KEY);
    res.json({
      enabled: config.enabled,
      model: config.model,
      allowInCompetition: config.allowInCompetition,
      defaultMode: config.defaultMode,
      hasApiKey,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch AI configuration' });
  }
});

// 2. POST /api/ai/config - Admin only: update AI configuration
router.post('/config', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin privileges required' });
    }

    const { enabled, model, allowInCompetition, defaultMode, apiKey, systemPrompt } = req.body;
    const updated = dbStore.updateAIConfig({
      ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
      ...(model ? { model: String(model) } : {}),
      ...(allowInCompetition !== undefined ? { allowInCompetition: Boolean(allowInCompetition) } : {}),
      ...(defaultMode ? { defaultMode } : {}),
      ...(apiKey !== undefined ? { apiKey: String(apiKey).trim() } : {}),
      ...(systemPrompt ? { systemPrompt: String(systemPrompt) } : {}),
    });

    dbStore.addAuditLog({
      userId: req.user.id,
      userName: req.user.fullName,
      action: 'SETTINGS_UPDATE',
      details: `AI Assistant settings updated. Enabled: ${updated.enabled}, Model: ${updated.model}, Mode: ${updated.defaultMode}.`,
    });

    res.json({
      success: true,
      config: {
        enabled: updated.enabled,
        model: updated.model,
        allowInCompetition: updated.allowInCompetition,
        defaultMode: updated.defaultMode,
        hasApiKey: Boolean(updated.apiKey || process.env.GEMINI_API_KEY),
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update AI settings' });
  }
});

// 3. POST /api/ai/chat - AI Assistant Chat
router.post('/chat', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const aiConfig = dbStore.getAIConfig();
    if (!aiConfig.enabled) {
      return res.status(403).json({ error: 'AI Assistant has been disabled by the competition administrator.' });
    }

    const { message, mode = aiConfig.defaultMode, context } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const effectiveMode: 'practice' | 'competition' =
      !aiConfig.allowInCompetition ? 'competition' : (mode === 'practice' ? 'practice' : 'competition');

    const apiKey = aiConfig.apiKey || process.env.GEMINI_API_KEY;

    // If an external Gemini API key is configured, call Google Gemini REST API
    if (apiKey) {
      try {
        const systemInstruction = effectiveMode === 'competition'
          ? 'You are CODEQUEST AI Socratic Mentor. You are in COMPETITION MODE. Under strict academic integrity rules, YOU MUST NEVER PROVIDE WORKING CODE OR FULL SOLUTIONS. Instead, offer conceptual hints, identify algorithmic archetypes (DP, Two Pointers, Graph, etc.), discuss time/space complexities, and suggest edge cases to test.'
          : (aiConfig.systemPrompt || 'You are CODEQUEST AI Assistant, an elite competitive programming mentor and tutor.');

        const promptText = `System Instruction:\n${systemInstruction}\n\nContext:\n- Round: ${context?.roundId || 'N/A'}\n- Problem: ${context?.problemTitle || 'N/A'}\n- Language: ${context?.language || 'N/A'}\n- Code Snippet:\n\`\`\`\n${context?.code || 'None'}\n\`\`\`\n\nUser Question:\n${message}`;

        const modelName = aiConfig.model || 'gemini-1.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: effectiveMode === 'competition' ? 0.3 : 0.7,
              maxOutputTokens: 1000,
            },
          }),
        });

        if (response.ok) {
          const geminiData = await response.json();
          const reply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            return res.json({
              reply,
              mode: effectiveMode,
              suggestions: [
                'Can you clarify the edge cases?',
                'What is the optimal complexity?',
                'Give me another conceptual hint',
              ],
            });
          }
        }
      } catch (geminiErr) {
        console.warn('Gemini API call failed, falling back to built-in CODEQUEST engine:', geminiErr);
      }
    }

    // Fallback to intelligent built-in competitive programming engine
    const result = generateIntelligentResponse(message, effectiveMode, context);
    return res.json({
      reply: result.reply,
      mode: effectiveMode,
      suggestions: result.suggestions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'AI service error' });
  }
});

// 4. POST /api/ai/analyze-code - Code Quality & Complexity Review
router.post('/analyze-code', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { code, language = 'python', problemTitle } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Code content is required' });
    }

    // Static analysis heuristics
    const lines = code.split('\n');
    const lineCount = lines.length;

    // Detect loops and nesting
    const forMatches = (code.match(/\bfor\b/g) || []).length;
    const whileMatches = (code.match(/\bwhile\b/g) || []).length;
    const totalLoops = forMatches + whileMatches;

    // Estimate complexity
    let estimatedTime = 'O(N)';
    let timeExplanation = 'Single pass iteration detected.';
    if (totalLoops >= 2) {
      estimatedTime = 'O(N²)';
      timeExplanation = 'Multiple or nested loops detected. This may exceed 2.0s time limit if N > 10,000.';
    } else if (code.includes('sort') || code.includes('sorted') || code.includes('std::sort')) {
      estimatedTime = 'O(N log N)';
      timeExplanation = 'Sorting operation identified. Highly optimal for N up to 100,000.';
    } else if (totalLoops === 0) {
      estimatedTime = 'O(1)';
      timeExplanation = 'Constant time mathematical formulation or direct indexing.';
    }

    // Space complexity
    let estimatedSpace = 'O(1)';
    let spaceExplanation = 'In-place state variables with minimal extra memory.';
    if (code.includes('map') || code.includes('dict') || code.includes('Set') || code.includes('set()') || code.includes('vector') || code.includes('list')) {
      estimatedSpace = 'O(N)';
      spaceExplanation = 'Auxiliary collection/hash table allocated for elements.';
    }

    // Potential Pitfalls
    const pitfalls: string[] = [];
    if (code.includes('input()') && !code.includes('strip()')) {
      pitfalls.push('Raw input without .strip() may contain trailing newline characters.');
    }
    if (totalLoops >= 2) {
      pitfalls.push('Quadratic time complexity risk on large hidden test cases.');
    }
    if (!code.includes('len(') && !code.includes('.length') && !code.includes('.size()')) {
      pitfalls.push('Ensure boundary checks exist for empty or single-element inputs.');
    }
    if (pitfalls.length === 0) {
      pitfalls.push('No obvious syntax or performance anti-patterns identified.');
    }

    res.json({
      success: true,
      analysis: {
        problemTitle: problemTitle || 'Active Problem',
        language,
        metrics: {
          lineCount,
          loopCount: totalLoops,
          estimatedTimeComplexity: estimatedTime,
          timeExplanation,
          estimatedSpaceComplexity: estimatedSpace,
          spaceExplanation,
        },
        potentialPitfalls: pitfalls,
        recommendation: totalLoops >= 2
          ? 'Consider using a Hash Map or Two-Pointer technique to reduce the inner loop to O(1) lookup.'
          : 'Your algorithmic complexity is within competitive targets. Double-check extreme boundary cases.',
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Code analysis failed' });
  }
});

// 5. POST /api/ai/roadmap - Personalized Learning Roadmap
router.post('/roadmap', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const submissions = dbStore.getSubmissions({ userId: user.id });
    const solvedCount = submissions.filter((s) => s.status === 'ACCEPTED').length;

    res.json({
      success: true,
      roadmap: {
        participantName: user.fullName,
        currentLevel: solvedCount >= 5 ? 'Advanced Competitive Coder' : (solvedCount >= 2 ? 'Intermediate Contender' : 'Rising Challenger'),
        milestones: [
          {
            title: 'Round 1: Rapid Knowledge & Quiz Mastery',
            status: 'active',
            focus: ['Time/Space Complexity Math', 'Language Internals', 'OOP & Memory Management'],
            recommendedAction: 'Practice quiz rounds with negative marking discipline.',
          },
          {
            title: 'Round 2: Algorithmic Implementation',
            status: solvedCount >= 1 ? 'completed' : 'upcoming',
            focus: ['Two Pointers', 'Sliding Window', 'Prefix Sums', 'Greedy Choices'],
            recommendedAction: 'Target sub-50ms execution times and eliminate redundant memory allocations.',
          },
          {
            title: 'Round 3: High-Pressure Bug Hunting',
            status: 'upcoming',
            focus: ['Off-By-One Errors', 'Pointer Null Checks', 'Floating Point Precision', 'Recursion Depth'],
            recommendedAction: 'Review standard competitive debugging test benches.',
          },
          {
            title: 'Round 4: Grand Final Showdown',
            status: 'upcoming',
            focus: ['Dynamic Programming with State Compression', 'Graph Traversal', 'Stress Testing'],
            recommendedAction: 'Simulate full mock competition environments under proctoring cameras.',
          },
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate roadmap' });
  }
});

export default router;
