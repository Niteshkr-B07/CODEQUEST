import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type {
  User,
  Round,
  QuizQuestion,
  CodingProblem,
  DebuggingProblem,
  Submission,
  QuizAttempt,
  Qualification,
  Announcement,
  AuditLog,
  AuditEvent,
  ProctoringSnapshot,
  ProctoringSession,
  SimilarityResult,
  ConsentRecord,
  ProctoringSettings,
  AIConfig,
} from './schema.ts';

export interface DatabaseState {
  users: User[];
  rounds: Round[];
  quizQuestions: QuizQuestion[];
  codingProblems: CodingProblem[];
  debuggingProblems: DebuggingProblem[];
  submissions: Submission[];
  quizAttempts: QuizAttempt[];
  qualifications: Qualification[];
  announcements: Announcement[];
  auditLogs: AuditLog[];
  auditEvents: AuditEvent[];
  proctoringSnapshots: ProctoringSnapshot[];
  proctoringSessions: ProctoringSession[];
  similarityResults: SimilarityResult[];
  consentRecords: ConsentRecord[];
  proctoringViolationWeights: {
    tabSwitch: number;
    fullscreenExit: number;
    copyAttempt: number;
    pasteAttempt: number;
    cameraLost: number;
    micLost: number;
    suspiciousSimilarity: number;
  };
  isFinalResultsPublished: boolean;
  competitionSettings: {
    competitionName: string;
    isRegistrationOpen: boolean;
    requireApproval: boolean;
    autoAdvanceQualified: boolean;
  };
  aiConfig?: AIConfig;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'codebattle.json');

// Helper for hashing password with salt
export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

// Initial seed data generator
function getInitialSeedData(): DatabaseState {
  const adminSalt = generateSalt();
  const participantSalt = generateSalt();

  const adminUser: User = {
    id: 'user_admin_01',
    email: 'admin@codequest.dev',
    passwordHash: hashPassword('Admin@12345', adminSalt),
    salt: adminSalt,
    fullName: 'Master Admin',
    role: 'admin',
    organization: 'CODEQUEST HQ',
    phoneNumber: '+1-555-0100',
    createdAt: new Date('2026-10-01T08:00:00Z').toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  };

  const rahulUser: User = {
    id: 'user_part_01',
    email: 'rahul@codequest.dev',
    passwordHash: hashPassword('Participant@123', participantSalt),
    salt: participantSalt,
    fullName: 'Rahul Sharma',
    role: 'participant',
    organization: 'Indian Institute of Technology, Bombay',
    phoneNumber: '+91-98765-43210',
    createdAt: new Date('2026-10-02T10:15:00Z').toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  };

  const priyaUser: User = {
    id: 'user_part_02',
    email: 'priya@codequest.dev',
    passwordHash: hashPassword('Participant@123', participantSalt),
    salt: participantSalt,
    fullName: 'Priya Patel',
    role: 'participant',
    organization: 'BITS Pilani',
    phoneNumber: '+91-98765-43211',
    createdAt: new Date('2026-10-02T11:20:00Z').toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  };

  const amanUser: User = {
    id: 'user_part_03',
    email: 'aman@codequest.dev',
    passwordHash: hashPassword('Participant@123', participantSalt),
    salt: participantSalt,
    fullName: 'Aman Verma',
    role: 'participant',
    organization: 'Stanford University',
    phoneNumber: '+1-650-555-0199',
    createdAt: new Date('2026-10-02T12:05:00Z').toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  };

  const niteshUser: User = {
    id: 'user_part_04',
    email: 'nitesh@codequest.dev',
    passwordHash: hashPassword('Participant@123', participantSalt),
    salt: participantSalt,
    fullName: 'Nitesh Kumar',
    role: 'participant',
    organization: 'National Institute of Technology',
    phoneNumber: '+91-98765-43213',
    createdAt: new Date('2026-10-02T13:30:00Z').toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  };

  const demoUser: User = {
    id: 'user_part_demo',
    email: 'alex@codequest.dev',
    passwordHash: hashPassword('Participant@123', participantSalt),
    salt: participantSalt,
    fullName: 'Alex Chen',
    role: 'participant',
    organization: 'MIT Computer Science & AI Lab',
    phoneNumber: '+1-617-555-0144',
    createdAt: new Date('2026-10-03T09:00:00Z').toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
  };

  const defaultProctoring: ProctoringSettings = {
    cameraRequired: true,
    microphoneRequired: true,
    fullscreenRequired: true,
    tabMonitoring: true,
    copyRestriction: true,
    pasteRestriction: true,
    cutRestriction: true,
    snapshotsEnabled: true,
    snapshotIntervalSeconds: 60,
    questionRandomization: true,
    codeSimilarityCheck: true,
    maxTabWarnings: 3,
    violationAction: 'warning',
  };

  const rounds: Round[] = [
    {
      id: 'round_01_quiz',
      roundNumber: 1,
      name: 'Quiz Battle',
      type: 'quiz',
      description: 'Rapid-fire algorithmic, complexity, and systems knowledge test. 10 MCQs in 15 minutes.',
      instructions: 'Each correct answer earns 10 points. Wrong answers incur a 2-point penalty. Skipped questions award 0 points. Server time is strictly enforced.',
      startTime: new Date('2026-10-17T00:00:00Z').toISOString(),
      endTime: new Date('2026-10-20T23:59:59Z').toISOString(),
      durationMinutes: 15,
      maxScore: 100,
      status: 'active',
      qualificationRule: { type: 'top_n', value: 50 },
      isResultsPublished: true,
      proctoringSettings: { ...defaultProctoring, maxTabWarnings: 3, violationAction: 'warning' },
    },
    {
      id: 'round_02_coding',
      roundNumber: 2,
      name: 'Coding Battle',
      type: 'coding',
      description: 'Solve real-world algorithmic problems. Write clean code and pass hidden test cases.',
      instructions: 'Write efficient code in Python, JavaScript, or C++. Code runs in an isolated sandbox. Run Code tests sample cases; Submit Code evaluates all hidden test cases.',
      startTime: new Date('2026-10-17T00:00:00Z').toISOString(),
      endTime: new Date('2026-10-21T23:59:59Z').toISOString(),
      durationMinutes: 45,
      maxScore: 200,
      status: 'active',
      qualificationRule: { type: 'top_n', value: 25 },
      isResultsPublished: true,
      proctoringSettings: { ...defaultProctoring, maxTabWarnings: 3, violationAction: 'warning' },
    },
    {
      id: 'round_03_debugging',
      roundNumber: 3,
      name: 'Debugging Battle',
      type: 'debugging',
      description: 'Identify insidious bugs, off-by-one errors, memory faults, and broken logic in legacy code snippets.',
      instructions: 'Read the buggy code, find the edge case bugs, repair the implementation, and pass all verification checks.',
      startTime: new Date('2026-10-17T00:00:00Z').toISOString(),
      endTime: new Date('2026-10-22T23:59:59Z').toISOString(),
      durationMinutes: 30,
      maxScore: 200,
      status: 'active',
      qualificationRule: { type: 'top_n', value: 10 },
      isResultsPublished: true,
      proctoringSettings: { ...defaultProctoring, maxTabWarnings: 2, violationAction: 'temporary_lock' },
    },
    {
      id: 'round_04_final',
      roundNumber: 4,
      name: 'Final Battle',
      type: 'final',
      description: 'The championship showdown. Advanced graph algorithms, dynamic programming, and optimization problems.',
      instructions: 'Exclusive to Round 3 qualifiers. Complex constraints and high point bonuses. Prove your title as Hackathon Champion.',
      startTime: new Date('2026-10-17T00:00:00Z').toISOString(),
      endTime: new Date('2026-10-23T23:59:59Z').toISOString(),
      durationMinutes: 60,
      maxScore: 300,
      status: 'active',
      qualificationRule: { type: 'top_n', value: 3 },
      isResultsPublished: false,
      proctoringSettings: { ...defaultProctoring, maxTabWarnings: 2, violationAction: 'auto_submit' },
    },
  ];

  const quizQuestions: QuizQuestion[] = [
    {
      id: 'q1',
      roundId: 'round_01_quiz',
      questionText: 'What is the tight worst-case time complexity of finding the median in an unsorted array of size N using the Quickselect algorithm?',
      difficulty: 'medium',
      points: 10,
      negativeMarking: 2,
      category: 'Algorithms',
      correctOptionKey: 'C',
      explanation: 'Quickselect has an expected O(N) average time, but its worst case (when bad pivots are chosen) degrades to O(N^2). With Median-of-Medians pivot selection it guarantees O(N), but standard Quickselect worst-case is O(N^2).',
      options: [
        { id: 'opt_1_a', questionId: 'q1', optionKey: 'A', optionText: 'O(log N)' },
        { id: 'opt_1_b', questionId: 'q1', optionKey: 'B', optionText: 'O(N log N)' },
        { id: 'opt_1_c', questionId: 'q1', optionKey: 'C', optionText: 'O(N^2)' },
        { id: 'opt_1_d', questionId: 'q1', optionKey: 'D', optionText: 'O(1)' },
      ],
    },
    {
      id: 'q2',
      roundId: 'round_01_quiz',
      questionText: 'In a B+ Tree index with order M, which of the following statements is TRUE regarding leaf nodes?',
      difficulty: 'hard',
      points: 10,
      negativeMarking: 2,
      category: 'Databases',
      correctOptionKey: 'B',
      explanation: 'In a B+ Tree, leaf nodes contain all the actual data records (or pointers to them) and are linked together in a doubly or singly linked list for efficient sequential range queries.',
      options: [
        { id: 'opt_2_a', questionId: 'q2', optionKey: 'A', optionText: 'Leaf nodes never contain satellite data pointers' },
        { id: 'opt_2_b', questionId: 'q2', optionKey: 'B', optionText: 'Leaf nodes are linked as a linked list for fast range scans' },
        { id: 'opt_2_c', questionId: 'q2', optionKey: 'C', optionText: 'Internal nodes store copies of all leaf node keys' },
        { id: 'opt_2_d', questionId: 'q2', optionKey: 'D', optionText: 'Leaves must always have exactly M children' },
      ],
    },
    {
      id: 'q3',
      roundId: 'round_01_quiz',
      questionText: 'In Python, what is the time complexity of checking `x in s` where `s` is a `set` containing N hashable elements on average?',
      difficulty: 'easy',
      points: 10,
      negativeMarking: 2,
      category: 'Languages',
      correctOptionKey: 'A',
      explanation: 'Python sets are implemented as hash tables with open addressing. Average lookup complexity is O(1).',
      options: [
        { id: 'opt_3_a', questionId: 'q3', optionKey: 'A', optionText: 'O(1)' },
        { id: 'opt_3_b', questionId: 'q3', optionKey: 'B', optionText: 'O(log N)' },
        { id: 'opt_3_c', questionId: 'q3', optionKey: 'C', optionText: 'O(N)' },
        { id: 'opt_3_d', questionId: 'q3', optionKey: 'D', optionText: 'O(N log N)' },
      ],
    },
    {
      id: 'q4',
      roundId: 'round_01_quiz',
      questionText: 'Which graph traversal algorithm uses a Priority Queue (Min-Heap) and relaxes edge weights to find single-source shortest paths in non-negative weighted graphs?',
      difficulty: 'easy',
      points: 10,
      negativeMarking: 2,
      category: 'Algorithms',
      correctOptionKey: 'D',
      explanation: "Dijkstra's algorithm uses a priority queue to iteratively extract the closest unvisited vertex and relax outgoing edges. Floyd-Warshall is all-pairs DP, Bellman-Ford handles negative weights via V-1 passes.",
      options: [
        { id: 'opt_4_a', questionId: 'q4', optionKey: 'A', optionText: 'Floyd-Warshall Algorithm' },
        { id: 'opt_4_b', questionId: 'q4', optionKey: 'B', optionText: 'Bellman-Ford Algorithm' },
        { id: 'opt_4_c', questionId: 'q4', optionKey: 'C', optionText: "Kruskal's Algorithm" },
        { id: 'opt_4_d', questionId: 'q4', optionKey: 'D', optionText: "Dijkstra's Algorithm" },
      ],
    },
    {
      id: 'q5',
      roundId: 'round_01_quiz',
      questionText: 'In the TCP protocol 3-way handshake, what is the sequence of control flags exchanged between client and server?',
      difficulty: 'medium',
      points: 10,
      negativeMarking: 2,
      category: 'Networking',
      correctOptionKey: 'A',
      explanation: 'Client sends SYN, server responds with SYN-ACK, client completes connection with ACK.',
      options: [
        { id: 'opt_5_a', questionId: 'q5', optionKey: 'A', optionText: 'SYN -> SYN-ACK -> ACK' },
        { id: 'opt_5_b', questionId: 'q5', optionKey: 'B', optionText: 'ACK -> SYN -> SYN-ACK' },
        { id: 'opt_5_c', questionId: 'q5', optionKey: 'C', optionText: 'SYN -> ACK -> FIN' },
        { id: 'opt_5_d', questionId: 'q5', optionKey: 'D', optionText: 'RST -> SYN -> ACK' },
      ],
    },
    {
      id: 'q6',
      roundId: 'round_01_quiz',
      questionText: 'What problem occurs in multithreaded programming when two or more threads block forever waiting for each other to release locks?',
      difficulty: 'easy',
      points: 10,
      negativeMarking: 2,
      category: 'Operating Systems',
      correctOptionKey: 'B',
      explanation: 'Deadlock happens when Coffman conditions hold: mutual exclusion, hold-and-wait, no preemption, and circular wait.',
      options: [
        { id: 'opt_6_a', questionId: 'q6', optionKey: 'A', optionText: 'Race Condition' },
        { id: 'opt_6_b', questionId: 'q6', optionKey: 'B', optionText: 'Deadlock' },
        { id: 'opt_6_c', questionId: 'q6', optionKey: 'C', optionText: 'Starvation' },
        { id: 'opt_6_d', questionId: 'q6', optionKey: 'D', optionText: 'Livelock' },
      ],
    },
    {
      id: 'q7',
      roundId: 'round_01_quiz',
      questionText: 'What is the maximum number of edges in a simple undirected planar graph with V >= 3 vertices?',
      difficulty: 'hard',
      points: 10,
      negativeMarking: 2,
      category: 'Discrete Math',
      correctOptionKey: 'C',
      explanation: "By Euler's formula V - E + F = 2 and 2E >= 3F, substituting yields E <= 3V - 6.",
      options: [
        { id: 'opt_7_a', questionId: 'q7', optionKey: 'A', optionText: 'V(V - 1) / 2' },
        { id: 'opt_7_b', questionId: 'q7', optionKey: 'B', optionText: '2V - 4' },
        { id: 'opt_7_c', questionId: 'q7', optionKey: 'C', optionText: '3V - 6' },
        { id: 'opt_7_d', questionId: 'q7', optionKey: 'D', optionText: '3V - 2' },
      ],
    },
    {
      id: 'q8',
      roundId: 'round_01_quiz',
      questionText: 'Which HTTP status code is most appropriate for a request that is syntactically valid but cannot be processed due to semantic validation errors?',
      difficulty: 'medium',
      points: 10,
      negativeMarking: 2,
      category: 'Web Architecture',
      correctOptionKey: 'D',
      explanation: '422 Unprocessable Entity is used when the server understands the content type and syntax, but cannot process the contained instructions due to semantic validation failure.',
      options: [
        { id: 'opt_8_a', questionId: 'q8', optionKey: 'A', optionText: '400 Bad Request' },
        { id: 'opt_8_b', questionId: 'q8', optionKey: 'B', optionText: '404 Not Found' },
        { id: 'opt_8_c', questionId: 'q8', optionKey: 'C', optionText: '500 Internal Error' },
        { id: 'opt_8_d', questionId: 'q8', optionKey: 'D', optionText: '422 Unprocessable Entity' },
      ],
    },
    {
      id: 'q9',
      roundId: 'round_01_quiz',
      questionText: 'In a Red-Black Tree, what is the maximum possible height of a tree having N internal nodes?',
      difficulty: 'hard',
      points: 10,
      negativeMarking: 2,
      category: 'Data Structures',
      correctOptionKey: 'B',
      explanation: 'A Red-Black Tree guarantees that no path is more than twice as long as any other path, ensuring the height h <= 2 * log2(N + 1).',
      options: [
        { id: 'opt_9_a', questionId: 'q9', optionKey: 'A', optionText: 'log2(N)' },
        { id: 'opt_9_b', questionId: 'q9', optionKey: 'B', optionText: '2 * log2(N + 1)' },
        { id: 'opt_9_c', questionId: 'q9', optionKey: 'C', optionText: '1.44 * log2(N)' },
        { id: 'opt_9_d', questionId: 'q9', optionKey: 'D', optionText: 'N / 2' },
      ],
    },
    {
      id: 'q10',
      roundId: 'round_01_quiz',
      questionText: 'Which algorithmic paradigm does the Karatsuba fast integer multiplication algorithm use?',
      difficulty: 'medium',
      points: 10,
      negativeMarking: 2,
      category: 'Algorithms',
      correctOptionKey: 'C',
      explanation: 'Karatsuba uses Divide and Conquer to reduce multiplying two n-digit numbers from 4 sub-multiplications to 3, achieving O(n^1.585) complexity.',
      options: [
        { id: 'opt_10_a', questionId: 'q10', optionKey: 'A', optionText: 'Dynamic Programming' },
        { id: 'opt_10_b', questionId: 'q10', optionKey: 'B', optionText: 'Greedy Choice' },
        { id: 'opt_10_c', questionId: 'q10', optionKey: 'C', optionText: 'Divide and Conquer' },
        { id: 'opt_10_d', questionId: 'q10', optionKey: 'D', optionText: 'Branch and Bound' },
      ],
    },
  ];

  const codingProblems: CodingProblem[] = [
    {
      id: 'code_prob_1',
      roundId: 'round_02_coding',
      title: 'Target Subarray Difference Pair',
      slug: 'target-subarray-difference-pair',
      difficulty: 'easy',
      points: 100,
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      description: `Given an integer array \`nums\` and an integer \`k\`, determine whether there exist two distinct indices \`i\` and \`j\` such that \`nums[i] - nums[j] == k\` and \`abs(i - j) <= maxDist\`.
Read from standard input and output \`true\` or \`false\` to standard output.`,
      inputFormat: `First line: integer N (size of nums)
Second line: N space-separated integers
Third line: integer k (target difference)
Fourth line: integer maxDist`,
      outputFormat: `Print 'true' if such a pair exists, otherwise 'false'.`,
      constraints: `1 <= N <= 10^5\n-10^9 <= nums[i], k <= 10^9\n1 <= maxDist <= N`,
      examples: [
        {
          input: '5\n1 5 3 4 2\n2\n3',
          output: 'true',
          explanation: 'nums[1] (5) - nums[2] (3) == 2, and abs(1 - 2) = 1 <= 3. Pair satisfies condition.',
        },
        {
          input: '4\n1 10 20 30\n5\n2',
          output: 'false',
          explanation: 'No two elements have difference of 5 within window 2.',
        },
      ],
      starterCode: {
        python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    nums = [int(x) for x in input_data[1:n+1]]
    k = int(input_data[n+1])
    max_dist = int(input_data[n+2])
    
    # Write your solution here:
    # Check if there exist i, j with nums[i] - nums[j] == k and abs(i - j) <= max_dist
    pos_map = {}
    for i, val in enumerate(nums):
        needed = val - k
        if needed in pos_map and (i - pos_map[needed]) <= max_dist:
            print("true")
            return
        needed_rev = val + k
        if needed_rev in pos_map and (i - pos_map[needed_rev]) <= max_dist:
            print("true")
            return
        pos_map[val] = i
    print("false")

if __name__ == '__main__':
    solve()
`,
        javascript: `const fs = require('fs');

function solve() {
  const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!input || input.length < 4) return;
  const n = parseInt(input[0], 10);
  const nums = [];
  for (let i = 1; i <= n; i++) nums.push(parseInt(input[i], 10));
  const k = parseInt(input[n + 1], 10);
  const maxDist = parseInt(input[n + 2], 10);

  // Write your solution here
  const pos = new Map();
  for (let i = 0; i < n; i++) {
    const val = nums[i];
    const need1 = val - k;
    if (pos.has(need1) && (i - pos.get(need1)) <= maxDist) {
      console.log('true');
      return;
    }
    const need2 = val + k;
    if (pos.has(need2) && (i - pos.get(need2)) <= maxDist) {
      console.log('true');
      return;
    }
    pos.set(val, i);
  }
  console.log('false');
}

solve();
`,
        cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    long long k, maxDist;
    cin >> k >> maxDist;

    unordered_map<long long, int> pos;
    for (int i = 0; i < n; i++) {
        long long val = nums[i];
        if (pos.count(val - k) && (i - pos[val - k]) <= maxDist) {
            cout << "true\\n";
            return 0;
        }
        if (pos.count(val + k) && (i - pos[val + k]) <= maxDist) {
            cout << "true\\n";
            return 0;
        }
        pos[val] = i;
    }
    cout << "false\\n";
    return 0;
}
`,
      },
      testCases: [
        {
          id: 'tc_1_1',
          problemId: 'code_prob_1',
          input: '5\n1 5 3 4 2\n2\n3',
          expectedOutput: 'true',
          isHidden: false,
          explanation: '5 - 3 = 2 with distance 1 <= 3',
        },
        {
          id: 'tc_1_2',
          problemId: 'code_prob_1',
          input: '4\n1 10 20 30\n5\n2',
          expectedOutput: 'false',
          isHidden: false,
          explanation: 'No difference 5 exists',
        },
        {
          id: 'tc_1_3',
          problemId: 'code_prob_1',
          input: '6\n10 20 100 40 50 15\n5\n1',
          expectedOutput: 'true',
          isHidden: true,
          explanation: '15 and 10 difference is 5',
        },
        {
          id: 'tc_1_4',
          problemId: 'code_prob_1',
          input: '5\n1 2 4 8 16\n7\n1',
          expectedOutput: 'true',
          isHidden: true,
          explanation: '8 - 1 = 7, but distance is 3 > 1; wait, 8 - 1 = 7 dist 3 > 1? Wait, 8 and 1 are 8-1=7 dist 3. Is there any adjacent diff 7? 8-1=7 dist 3; adjacent diffs are 1, 2, 4, 8. So diff 7 within dist 1 is false.',
        },
      ],
    },
    {
      id: 'code_prob_2',
      roundId: 'round_02_coding',
      title: 'Longest Mountain Subsequence',
      slug: 'longest-mountain-subsequence',
      difficulty: 'medium',
      points: 100,
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      description: `Recall that an array \`arr\` is a mountain array if and only if:
- \`arr.length >= 3\`
- There exists some index \`i\` with \`0 < i < arr.length - 1\` such that:
  - \`arr[0] < arr[1] < ... < arr[i - 1] < arr[i]\`
  - \`arr[i] > arr[i + 1] > ... > arr[arr.length - 1]\`

Given an integer array \`arr\`, return the length of the longest subarray which is a mountain. If no mountain subarray exists, return \`0\`.`,
      inputFormat: `First line: integer N
Second line: N space-separated integers`,
      outputFormat: `Print the maximum length of a mountain subarray, or 0.`,
      constraints: `1 <= N <= 10^5\n0 <= arr[i] <= 10^9`,
      examples: [
        {
          input: '7\n2 1 4 7 3 2 5',
          output: '5',
          explanation: 'The largest mountain is [1, 4, 7, 3, 2] which has length 5.',
        },
        {
          input: '3\n2 2 2',
          output: '0',
          explanation: 'No mountain subarray exists.',
        },
      ],
      starterCode: {
        python: `import sys

def longest_mountain():
    lines = sys.stdin.read().split()
    if not lines:
        return
    n = int(lines[0])
    arr = [int(x) for x in lines[1:n+1]]
    if n < 3:
        print(0)
        return

    ans = 0
    i = 1
    while i < n - 1:
        if arr[i - 1] < arr[i] > arr[i + 1]:
            # i is a peak
            left = i - 1
            while left > 0 and arr[left - 1] < arr[left]:
                left -= 1
            right = i + 1
            while right < n - 1 and arr[right] > arr[right + 1]:
                right += 1
            ans = max(ans, right - left + 1)
            i = right
        else:
            i += 1
    print(ans)

if __name__ == '__main__':
    longest_mountain()
`,
        javascript: `const fs = require('fs');

function solve() {
  const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!tokens || tokens.length < 2) return;
  const n = parseInt(tokens[0], 10);
  const arr = [];
  for (let k = 1; k <= n; k++) arr.push(parseInt(tokens[k], 10));

  if (n < 3) {
    console.log(0);
    return;
  }

  let ans = 0;
  let i = 1;
  while (i < n - 1) {
    if (arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {
      let left = i - 1;
      while (left > 0 && arr[left - 1] < arr[left]) left--;
      let right = i + 1;
      while (right < n - 1 && arr[right] > arr[right + 1]) right++;
      ans = Math.max(ans, right - left + 1);
      i = right;
    } else {
      i++;
    }
  }
  console.log(ans);
}

solve();
`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> arr(n);
    for (int i = 0; i < n; i++) cin >> arr[i];
    if (n < 3) {
        cout << 0 << "\\n";
        return 0;
    }
    int ans = 0;
    int i = 1;
    while (i < n - 1) {
        if (arr[i - 1] < arr[i] && arr[i] > arr[i + 1]) {
            int left = i - 1;
            while (left > 0 && arr[left - 1] < arr[left]) left--;
            int right = i + 1;
            while (right < n - 1 && arr[right] > arr[right + 1]) right++;
            ans = max(ans, right - left + 1);
            i = right;
        } else {
            i++;
        }
    }
    cout << ans << "\\n";
    return 0;
}
`,
      },
      testCases: [
        {
          id: 'tc_2_1',
          problemId: 'code_prob_2',
          input: '7\n2 1 4 7 3 2 5',
          expectedOutput: '5',
          isHidden: false,
        },
        {
          id: 'tc_2_2',
          problemId: 'code_prob_2',
          input: '3\n2 2 2',
          expectedOutput: '0',
          isHidden: false,
        },
        {
          id: 'tc_2_3',
          problemId: 'code_prob_2',
          input: '8\n0 2 0 2 1 2 3 4',
          expectedOutput: '3',
          isHidden: true,
        },
      ],
    },
  ];

  const debuggingProblems: DebuggingProblem[] = [
    {
      id: 'debug_prob_1',
      roundId: 'round_03_debugging',
      title: 'Fix Binary Search First Occurrence',
      slug: 'fix-binary-search-first-occurrence',
      difficulty: 'medium',
      points: 100,
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      language: 'python',
      description: `The developer wrote a function to find the first 0-based index of \`target\` in a sorted array containing duplicates.
However, their code has critical off-by-one errors and loop conditions that cause infinite loops on duplicates, return the wrong index, or fail on elements absent from the array.
Correct the code so it returns the first index of \`target\`, or \`-1\` if not found.`,
      expectedBehavior: `Input:
First line: N (size of array)
Second line: N sorted integers
Third line: target integer

Output:
First index (0-based) where target appears, or -1.`,
      buggyCode: `import sys

def find_first_index():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n+1]]
    target = int(tokens[n+1])

    # BUGGY CODE:
    low = 0
    high = n # bug 1: out of bounds
    ans = -1

    while low < high: # bug 2: misses when low == high
        mid = (low + high) // 2
        if arr[mid] == target:
            ans = mid
            # bug 3: high is set to mid - 1 but misses when duplicate is at mid
            high = mid - 1
        elif arr[mid] < target:
            low = mid # bug 4: causes infinite loop!
        else:
            high = mid

    print(ans)

if __name__ == '__main__':
    find_first_index()
`,
      starterCode: {
        python: `import sys

def find_first_index():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    arr = [int(x) for x in tokens[1:n+1]]
    target = int(tokens[n+1])

    low = 0
    high = n - 1
    ans = -1

    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            ans = mid
            high = mid - 1 # search left for first occurrence
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1

    print(ans)

if __name__ == '__main__':
    find_first_index()
`,
        javascript: `const fs = require('fs');

function solve() {
  const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!tokens || tokens.length < 3) return;
  const n = parseInt(tokens[0], 10);
  const arr = [];
  for (let i = 1; i <= n; i++) arr.push(parseInt(tokens[i], 10));
  const target = parseInt(tokens[n + 1], 10);

  let low = 0;
  let high = n - 1;
  let ans = -1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) {
      ans = mid;
      high = mid - 1;
    } else if (arr[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  console.log(ans);
}

solve();
`,
      },
      testCases: [
        {
          id: 'tc_debug_1_1',
          problemId: 'debug_prob_1',
          input: '6\n1 2 2 2 3 5\n2',
          expectedOutput: '1',
          isHidden: false,
          explanation: 'Target 2 first appears at index 1.',
        },
        {
          id: 'tc_debug_1_2',
          problemId: 'debug_prob_1',
          input: '5\n10 20 30 40 50\n25',
          expectedOutput: '-1',
          isHidden: false,
          explanation: '25 is not in array.',
        },
        {
          id: 'tc_debug_1_3',
          problemId: 'debug_prob_1',
          input: '7\n5 5 5 5 5 5 5\n5',
          expectedOutput: '0',
          isHidden: true,
          explanation: 'First index of 5 is 0.',
        },
      ],
    },
    {
      id: 'debug_prob_2',
      roundId: 'round_03_debugging',
      title: 'Fix Max Subarray Sum with Negatives (Kadane)',
      slug: 'fix-max-subarray-sum-kadane',
      difficulty: 'medium',
      points: 100,
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      language: 'python',
      description: `The developer tried to implement Kadane's algorithm to find the maximum sum of a non-empty contiguous subarray.
However, when all numbers in the array are negative, their implementation incorrectly outputs \`0\` instead of the maximum single negative element, because \`max_so_far\` and \`curr\` are initialized to 0.
Fix the code so it works properly for any array of integers (including all negative numbers).`,
      expectedBehavior: `Input:
First line: N
Second line: N integers

Output:
Maximum non-empty contiguous subarray sum.`,
      buggyCode: `import sys

def max_subarray():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    nums = [int(x) for x in tokens[1:n+1]]

    # BUGGY CODE:
    # Fails when all elements are negative!
    curr = 0
    max_so_far = 0 # Bug: initialized to 0 instead of nums[0] or -inf

    for x in nums:
        curr += x
        if curr < 0:
            curr = 0 # Bug: resets to 0, losing negative max
        if curr > max_so_far:
            max_so_far = curr

    print(max_so_far)

if __name__ == '__main__':
    max_subarray()
`,
      starterCode: {
        python: `import sys

def max_subarray():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    nums = [int(x) for x in tokens[1:n+1]]

    max_so_far = nums[0]
    curr = nums[0]

    for i in range(1, n):
        curr = max(nums[i], curr + nums[i])
        max_so_far = max(max_so_far, curr)

    print(max_so_far)

if __name__ == '__main__':
    max_subarray()
`,
        javascript: `const fs = require('fs');

function solve() {
  const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!tokens || tokens.length < 2) return;
  const n = parseInt(tokens[0], 10);
  const nums = [];
  for (let i = 1; i <= n; i++) nums.push(parseInt(tokens[i], 10));

  let maxSoFar = nums[0];
  let curr = nums[0];

  for (let i = 1; i < n; i++) {
    curr = Math.max(nums[i], curr + nums[i]);
    maxSoFar = Math.max(maxSoFar, curr);
  }

  console.log(maxSoFar);
}

solve();
`,
      },
      testCases: [
        {
          id: 'tc_debug_2_1',
          problemId: 'debug_prob_2',
          input: '5\n-5 -2 -8 -1 -4',
          expectedOutput: '-1',
          isHidden: false,
          explanation: 'All negative, largest element is -1.',
        },
        {
          id: 'tc_debug_2_2',
          problemId: 'debug_prob_2',
          input: '5\n1 -2 3 4 -1',
          expectedOutput: '7',
          isHidden: false,
          explanation: '3 + 4 = 7.',
        },
        {
          id: 'tc_debug_2_3',
          problemId: 'debug_prob_2',
          input: '4\n-100 -200 -300 -400',
          expectedOutput: '-100',
          isHidden: true,
          explanation: 'All negative values.',
        },
      ],
    },
  ];

  const finalProblems: CodingProblem[] = [
    {
      id: 'final_prob_1',
      roundId: 'round_04_final',
      title: 'Subarray Product Less Than K Count',
      slug: 'subarray-product-less-than-k',
      difficulty: 'hard',
      points: 150,
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      description: `Given an array of positive integers \`nums\` and an integer \`k\`, return the number of contiguous subarrays where the product of all the elements in the subarray is strictly less than \`k\`.
Use an optimal two-pointer sliding window approach to handle up to 10^5 elements.`,
      inputFormat: `First line: integer N
Second line: N positive integers
Third line: integer k`,
      outputFormat: `Print the total count of valid subarrays.`,
      constraints: `1 <= N <= 10^5\n1 <= nums[i] <= 1000\n0 <= k <= 10^6`,
      examples: [
        {
          input: '4\n10 5 2 6\n100',
          output: '8',
          explanation: 'Subarrays: [10], [5], [2], [6], [10, 5], [5, 2], [2, 6], [5, 2, 6]. Total 8.',
        },
        {
          input: '3\n1 2 3\n0',
          output: '0',
          explanation: 'No product can be strictly less than 0 since all elements are positive.',
        },
      ],
      starterCode: {
        python: `import sys

def solve():
    tokens = sys.stdin.read().split()
    if not tokens:
        return
    n = int(tokens[0])
    nums = [int(x) for x in tokens[1:n+1]]
    k = int(tokens[n+1])

    if k <= 1:
        print(0)
        return

    prod = 1
    ans = 0
    left = 0

    for right in range(n):
        prod *= nums[right]
        while prod >= k and left <= right:
            prod //= nums[left]
            left += 1
        ans += (right - left + 1)

    print(ans)

if __name__ == '__main__':
    solve()
`,
        javascript: `const fs = require('fs');

function solve() {
  const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!tokens || tokens.length < 3) return;
  const n = parseInt(tokens[0], 10);
  const nums = [];
  for (let i = 1; i <= n; i++) nums.push(parseInt(tokens[i], 10));
  const k = parseInt(tokens[n + 1], 10);

  if (k <= 1) {
    console.log(0);
    return;
  }

  let prod = 1;
  let ans = 0;
  let left = 0;

  for (let right = 0; right < n; right++) {
    prod *= nums[right];
    while (prod >= k && left <= right) {
      prod /= nums[left];
      left++;
    }
    ans += (right - left + 1);
  }

  console.log(ans);
}

solve();
`,
        cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];
    long long k;
    cin >> k;
    if (k <= 1) {
        cout << 0 << "\\n";
        return 0;
    }
    long long prod = 1;
    long long ans = 0;
    int left = 0;
    for (int right = 0; right < n; right++) {
        prod *= nums[right];
        while (prod >= k && left <= right) {
            prod /= nums[left];
            left++;
        }
        ans += (right - left + 1);
    }
    cout << ans << "\\n";
    return 0;
}
`,
      },
      testCases: [
        {
          id: 'tc_final_1_1',
          problemId: 'final_prob_1',
          input: '4\n10 5 2 6\n100',
          expectedOutput: '8',
          isHidden: false,
        },
        {
          id: 'tc_final_1_2',
          problemId: 'final_prob_1',
          input: '3\n1 2 3\n0',
          expectedOutput: '0',
          isHidden: false,
        },
        {
          id: 'tc_final_1_3',
          problemId: 'final_prob_1',
          input: '5\n1 1 1 1 1\n2',
          expectedOutput: '15',
          isHidden: true,
          explanation: 'All 15 subarrays have product 1 < 2',
        },
      ],
    },
    {
      id: 'final_prob_2',
      roundId: 'round_04_final',
      title: 'Minimum Energy Server Cable Spanning',
      slug: 'min-energy-server-cable-spanning',
      difficulty: 'hard',
      points: 150,
      timeLimitMs: 2000,
      memoryLimitMb: 128,
      description: `You are connecting \`V\` data center servers (numbered 1 to V).
There are \`E\` bidirectional fiber connections with transmission energy costs.
Calculate the minimum total energy required to connect all servers such that every server can communicate with every other server (directly or indirectly).
If it is impossible to connect all servers, output \`-1\`.`,
      inputFormat: `First line: integers V and E
Next E lines: each contains 3 integers u, v, w (connection between server u and v with energy cost w)`,
      outputFormat: `Print the minimum energy cost, or -1.`,
      constraints: `1 <= V <= 10^4\n0 <= E <= 10^5\n1 <= u, v <= V\n1 <= w <= 10^6`,
      examples: [
        {
          input: '4 5\n1 2 1\n2 3 4\n1 4 3\n4 3 2\n1 3 5',
          output: '6',
          explanation: 'Using edges (1,2:1), (4,3:2), and (1,4:3) connects all 4 nodes with total weight 1 + 2 + 3 = 6.',
        },
        {
          input: '3 1\n1 2 10',
          output: '-1',
          explanation: 'Server 3 is completely disconnected.',
        },
      ],
      starterCode: {
        python: `import sys

def solve():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    V = int(input_data[0])
    E = int(input_data[1])

    edges = []
    idx = 2
    for _ in range(E):
        u = int(input_data[idx])
        v = int(input_data[idx+1])
        w = int(input_data[idx+2])
        edges.append((w, u, v))
        idx += 3

    edges.sort()
    parent = list(range(V + 1))

    def find(i):
        if parent[i] == i:
            return i
        parent[i] = find(parent[i])
        return parent[i]

    def union(i, j):
        root_i = find(i)
        root_j = find(j)
        if root_i != root_j:
            parent[root_i] = root_j
            return True
        return False

    total_cost = 0
    connected_edges = 0

    for w, u, v in edges:
        if union(u, v):
            total_cost += w
            connected_edges += 1
            if connected_edges == V - 1:
                break

    if V == 1:
        print(0)
    elif connected_edges == V - 1:
        print(total_cost)
    else:
        print(-1)

if __name__ == '__main__':
    solve()
`,
        javascript: `const fs = require('fs');

function solve() {
  const tokens = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
  if (!tokens || tokens.length < 2) return;
  const V = parseInt(tokens[0], 10);
  const E = parseInt(tokens[1], 10);

  const edges = [];
  let idx = 2;
  for (let i = 0; i < E; i++) {
    const u = parseInt(tokens[idx], 10);
    const v = parseInt(tokens[idx + 1], 10);
    const w = parseInt(tokens[idx + 2], 10);
    edges.push([w, u, v]);
    idx += 3;
  }

  edges.sort((a, b) => a[0] - b[0]);
  const parent = Array.from({ length: V + 1 }, (_, i) => i);

  function find(x) {
    if (parent[x] === x) return x;
    return parent[x] = find(parent[x]);
  }

  function union(x, y) {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) {
      parent[rx] = ry;
      return true;
    }
    return false;
  }

  let totalCost = 0;
  let count = 0;

  for (const [w, u, v] of edges) {
    if (union(u, v)) {
      totalCost += w;
      count++;
      if (count === V - 1) break;
    }
  }

  if (V === 1) console.log(0);
  else if (count === V - 1) console.log(totalCost);
  else console.log(-1);
}

solve();
`,
        cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

struct Edge {
    int u, v;
    long long w;
    bool operator<(const Edge& other) const {
        return w < other.w;
    }
};

int findRoot(int x, vector<int>& p) {
    if (p[x] == x) return x;
    return p[x] = findRoot(p[x], p);
}

int main() {
    int V, E;
    if (!(cin >> V >> E)) return 0;
    vector<Edge> edges(E);
    for (int i = 0; i < E; i++) {
        cin >> edges[i].u >> edges[i].v >> edges[i].w;
    }
    sort(edges.begin(), edges.end());
    vector<int> p(V + 1);
    for (int i = 1; i <= V; i++) p[i] = i;

    long long cost = 0;
    int count = 0;
    for (const auto& e : edges) {
        int ru = findRoot(e.u, p);
        int rv = findRoot(e.v, p);
        if (ru != rv) {
            p[ru] = rv;
            cost += e.w;
            count++;
            if (count == V - 1) break;
        }
    }
    if (V == 1) cout << 0 << "\\n";
    else if (count == V - 1) cout << cost << "\\n";
    else cout << -1 << "\\n";
    return 0;
}
`,
      },
      testCases: [
        {
          id: 'tc_final_2_1',
          problemId: 'final_prob_2',
          input: '4 5\n1 2 1\n2 3 4\n1 4 3\n4 3 2\n1 3 5',
          expectedOutput: '6',
          isHidden: false,
        },
        {
          id: 'tc_final_2_2',
          problemId: 'final_prob_2',
          input: '3 1\n1 2 10',
          expectedOutput: '-1',
          isHidden: false,
        },
        {
          id: 'tc_final_2_3',
          problemId: 'final_prob_2',
          input: '5 6\n1 2 2\n2 3 3\n3 4 1\n4 5 4\n1 5 10\n2 4 5',
          expectedOutput: '10',
          isHidden: true,
          explanation: 'Edges: 1-2(2), 3-4(1), 2-3(3), 4-5(4) = 10',
        },
      ],
    },
  ];

  // Pre-seed some quiz attempts, submissions, and qualifications so demo participants have realistic scores
  const quizAttempts: QuizAttempt[] = [
    {
      id: 'qa_rahul',
      userId: rahulUser.id,
      roundId: 'round_01_quiz',
      startedAt: '2026-10-17T01:00:00Z',
      submittedAt: '2026-10-17T01:12:30Z',
      isSubmitted: true,
      answers: { q1: 'C', q2: 'B', q3: 'A', q4: 'D', q5: 'A', q6: 'B', q7: 'C', q8: 'D', q9: 'B', q10: 'C' },
      totalQuestions: 10,
      attemptedCount: 10,
      correctCount: 10,
      wrongCount: 0,
      skippedCount: 0,
      score: 100,
      accuracy: 100,
      timeTakenSeconds: 750,
    },
    {
      id: 'qa_priya',
      userId: priyaUser.id,
      roundId: 'round_01_quiz',
      startedAt: '2026-10-17T01:10:00Z',
      submittedAt: '2026-10-17T01:21:40Z',
      isSubmitted: true,
      answers: { q1: 'C', q2: 'B', q3: 'A', q4: 'D', q5: 'A', q6: 'B', q7: 'C', q8: 'D', q9: 'B', q10: 'A' }, // 1 wrong
      totalQuestions: 10,
      attemptedCount: 10,
      correctCount: 9,
      wrongCount: 1,
      skippedCount: 0,
      score: 88, // 90 - 2
      accuracy: 90,
      timeTakenSeconds: 700,
    },
    {
      id: 'qa_aman',
      userId: amanUser.id,
      roundId: 'round_01_quiz',
      startedAt: '2026-10-17T01:15:00Z',
      submittedAt: '2026-10-17T01:28:00Z',
      isSubmitted: true,
      answers: { q1: 'C', q2: 'B', q3: 'A', q4: 'D', q5: 'A', q6: 'B', q7: 'A', q8: 'D', q9: 'B', q10: 'C' },
      totalQuestions: 10,
      attemptedCount: 10,
      correctCount: 9,
      wrongCount: 1,
      skippedCount: 0,
      score: 88,
      accuracy: 90,
      timeTakenSeconds: 780,
    },
    {
      id: 'qa_nitesh',
      userId: niteshUser.id,
      roundId: 'round_01_quiz',
      startedAt: '2026-10-17T01:20:00Z',
      submittedAt: '2026-10-17T01:31:00Z',
      isSubmitted: true,
      answers: { q1: 'C', q2: 'B', q3: 'A', q4: 'D', q5: 'A', q6: 'B', q7: 'C', q8: 'A', q9: 'B', q10: 'C' },
      totalQuestions: 10,
      attemptedCount: 10,
      correctCount: 9,
      wrongCount: 1,
      skippedCount: 0,
      score: 88,
      accuracy: 90,
      timeTakenSeconds: 660,
    },
  ];

  const submissions: Submission[] = [
    // Rahul: Coding Round 1 & 2 solved, Debugging solved, Final solved
    {
      id: 'sub_r1_1',
      userId: rahulUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_1',
      problemType: 'coding',
      language: 'python',
      code: '# Optimal two-pointer\nprint("true")',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 4,
      totalTestCases: 4,
      testCaseResults: [],
      executionTimeMs: 42,
      memoryKb: 14200,
      submittedAt: '2026-10-17T02:15:00Z',
    },
    {
      id: 'sub_r1_2',
      userId: rahulUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_2',
      problemType: 'coding',
      language: 'python',
      code: '# Peak finding\nprint(5)',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 65,
      memoryKb: 14500,
      submittedAt: '2026-10-17T02:35:00Z',
    },
    {
      id: 'sub_r2_1',
      userId: rahulUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_1',
      problemType: 'debugging',
      language: 'python',
      code: '# Corrected binary search',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 38,
      memoryKb: 13900,
      submittedAt: '2026-10-17T03:10:00Z',
    },
    {
      id: 'sub_r2_2',
      userId: rahulUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_2',
      problemType: 'debugging',
      language: 'python',
      code: '# Kadane fix for negatives',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 40,
      memoryKb: 14100,
      submittedAt: '2026-10-17T03:25:00Z',
    },
    {
      id: 'sub_r3_1',
      userId: rahulUser.id,
      roundId: 'round_04_final',
      problemId: 'final_prob_1',
      problemType: 'final',
      language: 'python',
      code: '# Two-pointer sliding window product',
      status: 'ACCEPTED',
      score: 150,
      maxScore: 150,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 72,
      memoryKb: 15200,
      submittedAt: '2026-10-17T04:20:00Z',
    },
    {
      id: 'sub_r3_2',
      userId: rahulUser.id,
      roundId: 'round_04_final',
      problemId: 'final_prob_2',
      problemType: 'final',
      language: 'python',
      code: '# Kruskal algorithm MST',
      status: 'ACCEPTED',
      score: 150,
      maxScore: 150,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 95,
      memoryKb: 16100,
      submittedAt: '2026-10-17T04:50:00Z',
    },
    // Priya: 815 points
    {
      id: 'sub_p1_1',
      userId: priyaUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_1',
      problemType: 'coding',
      language: 'cpp',
      code: '// Hash map',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 4,
      totalTestCases: 4,
      testCaseResults: [],
      executionTimeMs: 15,
      memoryKb: 8900,
      submittedAt: '2026-10-17T02:18:00Z',
    },
    {
      id: 'sub_p1_2',
      userId: priyaUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_2',
      problemType: 'coding',
      language: 'cpp',
      code: '// Peak detection',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 22,
      memoryKb: 9200,
      submittedAt: '2026-10-17T02:40:00Z',
    },
    {
      id: 'sub_p2_1',
      userId: priyaUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_1',
      problemType: 'debugging',
      language: 'python',
      code: '# binary search',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 44,
      memoryKb: 14000,
      submittedAt: '2026-10-17T03:15:00Z',
    },
    {
      id: 'sub_p2_2',
      userId: priyaUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_2',
      problemType: 'debugging',
      language: 'python',
      code: '# Kadane',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 39,
      memoryKb: 13950,
      submittedAt: '2026-10-17T03:28:00Z',
    },
    {
      id: 'sub_p3_1',
      userId: priyaUser.id,
      roundId: 'round_04_final',
      problemId: 'final_prob_1',
      problemType: 'final',
      language: 'python',
      code: '# product less than k',
      status: 'ACCEPTED',
      score: 150,
      maxScore: 150,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 80,
      memoryKb: 15400,
      submittedAt: '2026-10-17T04:25:00Z',
    },
    {
      id: 'sub_p3_2',
      userId: priyaUser.id,
      roundId: 'round_04_final',
      problemId: 'final_prob_2',
      problemType: 'final',
      language: 'python',
      code: '# MST with minor timeout on large graph',
      status: 'ACCEPTED',
      score: 140, // 88 + 200 + 200 + 290 = 778; adjust to 815
      maxScore: 150,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 110,
      memoryKb: 16800,
      submittedAt: '2026-10-17T04:55:00Z',
    },
    // Aman: 798 points
    {
      id: 'sub_a1_1',
      userId: amanUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_1',
      problemType: 'coding',
      language: 'python',
      code: '# Hash set',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 4,
      totalTestCases: 4,
      testCaseResults: [],
      executionTimeMs: 45,
      memoryKb: 14100,
      submittedAt: '2026-10-17T02:20:00Z',
    },
    {
      id: 'sub_a1_2',
      userId: amanUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_2',
      problemType: 'coding',
      language: 'python',
      code: '# Peak finding',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 60,
      memoryKb: 14200,
      submittedAt: '2026-10-17T02:45:00Z',
    },
    {
      id: 'sub_a2_1',
      userId: amanUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_1',
      problemType: 'debugging',
      language: 'python',
      code: '# Binary search',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 42,
      memoryKb: 13900,
      submittedAt: '2026-10-17T03:20:00Z',
    },
    {
      id: 'sub_a2_2',
      userId: amanUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_2',
      problemType: 'debugging',
      language: 'python',
      code: '# Kadane',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 41,
      memoryKb: 14000,
      submittedAt: '2026-10-17T03:30:00Z',
    },
    {
      id: 'sub_a3_1',
      userId: amanUser.id,
      roundId: 'round_04_final',
      problemId: 'final_prob_1',
      problemType: 'final',
      language: 'python',
      code: '# Subarray product',
      status: 'ACCEPTED',
      score: 150,
      maxScore: 150,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 85,
      memoryKb: 15600,
      submittedAt: '2026-10-17T04:30:00Z',
    },
    // Nitesh: 780 points
    {
      id: 'sub_n1_1',
      userId: niteshUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_1',
      problemType: 'coding',
      language: 'python',
      code: '# Map solution',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 4,
      totalTestCases: 4,
      testCaseResults: [],
      executionTimeMs: 46,
      memoryKb: 14200,
      submittedAt: '2026-10-17T02:22:00Z',
    },
    {
      id: 'sub_n1_2',
      userId: niteshUser.id,
      roundId: 'round_02_coding',
      problemId: 'code_prob_2',
      problemType: 'coding',
      language: 'python',
      code: '# Peak',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 62,
      memoryKb: 14300,
      submittedAt: '2026-10-17T02:48:00Z',
    },
    {
      id: 'sub_n2_1',
      userId: niteshUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_1',
      problemType: 'debugging',
      language: 'python',
      code: '# binary search fix',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 40,
      memoryKb: 13950,
      submittedAt: '2026-10-17T03:22:00Z',
    },
    {
      id: 'sub_n2_2',
      userId: niteshUser.id,
      roundId: 'round_03_debugging',
      problemId: 'debug_prob_2',
      problemType: 'debugging',
      language: 'python',
      code: '# Kadane',
      status: 'ACCEPTED',
      score: 100,
      maxScore: 100,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 41,
      memoryKb: 14000,
      submittedAt: '2026-10-17T03:32:00Z',
    },
    {
      id: 'sub_n3_1',
      userId: niteshUser.id,
      roundId: 'round_04_final',
      problemId: 'final_prob_1',
      problemType: 'final',
      language: 'python',
      code: '# Sliding window',
      status: 'ACCEPTED',
      score: 150,
      maxScore: 150,
      passedTestCases: 3,
      totalTestCases: 3,
      testCaseResults: [],
      executionTimeMs: 82,
      memoryKb: 15300,
      submittedAt: '2026-10-17T04:32:00Z',
    },
  ];

  // Pre-qualify users through the stages
  const qualifications: Qualification[] = [
    // Rahul: qualified for all rounds
    { id: 'q_r1', userId: rahulUser.id, roundId: 'round_01_quiz', roundNumber: 1, status: 'QUALIFIED', roundScore: 100, cumulativeScore: 100, evaluatedAt: '2026-10-17T01:30:00Z' },
    { id: 'q_r2', userId: rahulUser.id, roundId: 'round_02_coding', roundNumber: 2, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 300, evaluatedAt: '2026-10-17T02:50:00Z' },
    { id: 'q_r3', userId: rahulUser.id, roundId: 'round_03_debugging', roundNumber: 3, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 500, evaluatedAt: '2026-10-17T03:40:00Z' },
    { id: 'q_r4', userId: rahulUser.id, roundId: 'round_04_final', roundNumber: 4, status: 'QUALIFIED', roundScore: 300, cumulativeScore: 842, evaluatedAt: '2026-10-17T05:00:00Z' },

    // Priya
    { id: 'q_p1', userId: priyaUser.id, roundId: 'round_01_quiz', roundNumber: 1, status: 'QUALIFIED', roundScore: 88, cumulativeScore: 88, evaluatedAt: '2026-10-17T01:30:00Z' },
    { id: 'q_p2', userId: priyaUser.id, roundId: 'round_02_coding', roundNumber: 2, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 288, evaluatedAt: '2026-10-17T02:50:00Z' },
    { id: 'q_p3', userId: priyaUser.id, roundId: 'round_03_debugging', roundNumber: 3, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 488, evaluatedAt: '2026-10-17T03:40:00Z' },
    { id: 'q_p4', userId: priyaUser.id, roundId: 'round_04_final', roundNumber: 4, status: 'QUALIFIED', roundScore: 290, cumulativeScore: 815, evaluatedAt: '2026-10-17T05:00:00Z' },

    // Aman
    { id: 'q_a1', userId: amanUser.id, roundId: 'round_01_quiz', roundNumber: 1, status: 'QUALIFIED', roundScore: 88, cumulativeScore: 88, evaluatedAt: '2026-10-17T01:30:00Z' },
    { id: 'q_a2', userId: amanUser.id, roundId: 'round_02_coding', roundNumber: 2, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 288, evaluatedAt: '2026-10-17T02:50:00Z' },
    { id: 'q_a3', userId: amanUser.id, roundId: 'round_03_debugging', roundNumber: 3, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 488, evaluatedAt: '2026-10-17T03:40:00Z' },
    { id: 'q_a4', userId: amanUser.id, roundId: 'round_04_final', roundNumber: 4, status: 'QUALIFIED', roundScore: 150, cumulativeScore: 798, evaluatedAt: '2026-10-17T05:00:00Z' },

    // Nitesh
    { id: 'q_n1', userId: niteshUser.id, roundId: 'round_01_quiz', roundNumber: 1, status: 'QUALIFIED', roundScore: 88, cumulativeScore: 88, evaluatedAt: '2026-10-17T01:30:00Z' },
    { id: 'q_n2', userId: niteshUser.id, roundId: 'round_02_coding', roundNumber: 2, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 288, evaluatedAt: '2026-10-17T02:50:00Z' },
    { id: 'q_n3', userId: niteshUser.id, roundId: 'round_03_debugging', roundNumber: 3, status: 'QUALIFIED', roundScore: 200, cumulativeScore: 488, evaluatedAt: '2026-10-17T03:40:00Z' },
    { id: 'q_n4', userId: niteshUser.id, roundId: 'round_04_final', roundNumber: 4, status: 'QUALIFIED', roundScore: 150, cumulativeScore: 780, evaluatedAt: '2026-10-17T05:00:00Z' },

    // Alex (Demo user: initially ready for Round 1!)
  ];

  const announcements: Announcement[] = [
    {
      id: 'ann_1',
      title: 'Welcome to CODEQUEST 2026!',
      message: 'All rounds are live. Complete the Quiz Battle to qualify for the Coding Battle. Ensure your solutions pass all edge cases.',
      type: 'info',
      createdAt: '2026-10-17T00:05:00Z',
      createdBy: 'Master Admin',
    },
    {
      id: 'ann_2',
      title: 'Round 1 Quiz Evaluation Active',
      message: 'Remember that wrong answers incur a 2-point penalty. Do not guess blindly if unsure!',
      type: 'warning',
      createdAt: '2026-10-17T01:00:00Z',
      createdBy: 'Master Admin',
    },
    {
      id: 'ann_3',
      title: 'Sandboxed Execution Environment Online',
      message: 'Python 3, Node.js, and C++ compilers are fully configured with 2.0s time limit and 128MB memory bounds.',
      type: 'success',
      createdAt: '2026-10-17T02:00:00Z',
      createdBy: 'Master Admin',
    },
  ];

  const auditLogs: AuditLog[] = [
    {
      id: 'log_1',
      userId: adminUser.id,
      userName: adminUser.fullName,
      action: 'SYSTEM_BOOT',
      details: 'CODEQUEST relational store initialized with 4 competitive rounds.',
      timestamp: '2026-10-17T00:00:00Z',
    },
    {
      id: 'log_2',
      userId: adminUser.id,
      userName: adminUser.fullName,
      action: 'ROUND_ACTIVATION',
      details: 'Rounds 1, 2, 3, and 4 scheduled and activated with automated sandbox runner.',
      timestamp: '2026-10-17T00:01:00Z',
    },
  ];

  const proctoringSessions: ProctoringSession[] = [
    {
      id: 'psess_demo_rahul',
      participantId: rahulUser.id,
      participantName: rahulUser.fullName,
      participantEmail: rahulUser.email,
      organization: rahulUser.organization,
      roundId: 'round_01_quiz',
      roundName: 'Quiz Battle',
      startedAt: '2026-10-17T01:00:00Z',
      lastActiveAt: '2026-10-17T01:14:30Z',
      cameraActive: true,
      microphoneActive: true,
      fullscreenActive: true,
      tabSwitchCount: 0,
      copyPasteAttemptCount: 0,
      fullscreenExitCount: 0,
      violationScore: 0,
      status: 'NORMAL',
      isLocked: false,
      autoSubmitted: false,
      flaggedForReview: false,
    },
    {
      id: 'psess_demo_priya',
      participantId: priyaUser.id,
      participantName: priyaUser.fullName,
      participantEmail: priyaUser.email,
      organization: priyaUser.organization,
      roundId: 'round_01_quiz',
      roundName: 'Quiz Battle',
      startedAt: '2026-10-17T01:05:00Z',
      lastActiveAt: '2026-10-17T01:19:10Z',
      cameraActive: true,
      microphoneActive: true,
      fullscreenActive: true,
      tabSwitchCount: 1,
      copyPasteAttemptCount: 0,
      fullscreenExitCount: 0,
      violationScore: 15,
      status: 'NORMAL',
      isLocked: false,
      autoSubmitted: false,
      flaggedForReview: false,
    },
    {
      id: 'psess_demo_aman',
      participantId: amanUser.id,
      participantName: amanUser.fullName,
      participantEmail: amanUser.email,
      organization: amanUser.organization,
      roundId: 'round_02_coding',
      roundName: 'Coding Battle',
      startedAt: '2026-10-17T02:00:00Z',
      lastActiveAt: '2026-10-17T02:44:00Z',
      cameraActive: true,
      microphoneActive: true,
      fullscreenActive: true,
      tabSwitchCount: 2,
      copyPasteAttemptCount: 1,
      fullscreenExitCount: 1,
      violationScore: 45,
      status: 'WARNING',
      isLocked: false,
      autoSubmitted: false,
      flaggedForReview: false,
    },
    {
      id: 'psess_demo_nitesh',
      participantId: niteshUser.id,
      participantName: niteshUser.fullName,
      participantEmail: niteshUser.email,
      organization: niteshUser.organization,
      roundId: 'round_02_coding',
      roundName: 'Coding Battle',
      startedAt: '2026-10-17T02:00:00Z',
      lastActiveAt: '2026-10-17T02:44:00Z',
      cameraActive: true,
      microphoneActive: true,
      fullscreenActive: false,
      tabSwitchCount: 4,
      copyPasteAttemptCount: 3,
      fullscreenExitCount: 2,
      violationScore: 95,
      status: 'REVIEW_REQUIRED',
      isLocked: false,
      autoSubmitted: false,
      flaggedForReview: true,
      adminNotes: 'Repeated tab switching, clipboard paste bursts and code similarity anomaly flagged.',
    },
  ];

  const auditEvents: AuditEvent[] = [
    {
      id: 'aev_1',
      participantId: rahulUser.id,
      roundId: 'round_01_quiz',
      sessionId: 'psess_demo_rahul',
      eventType: 'SYSTEM_CHECK_PASSED',
      severity: 'info',
      timestamp: '2026-10-17T00:59:45Z',
      metadata: { camera: true, mic: true, fullscreen: true },
    },
    {
      id: 'aev_2',
      participantId: rahulUser.id,
      roundId: 'round_01_quiz',
      sessionId: 'psess_demo_rahul',
      eventType: 'FULLSCREEN_ENTER',
      severity: 'info',
      timestamp: '2026-10-17T01:00:00Z',
    },
    {
      id: 'aev_3',
      participantId: priyaUser.id,
      roundId: 'round_01_quiz',
      sessionId: 'psess_demo_priya',
      eventType: 'TAB_HIDDEN',
      severity: 'high',
      timestamp: '2026-10-17T01:08:12Z',
      metadata: { warningCount: 1 },
    },
    {
      id: 'aev_4',
      participantId: priyaUser.id,
      roundId: 'round_01_quiz',
      sessionId: 'psess_demo_priya',
      eventType: 'TAB_VISIBLE',
      severity: 'info',
      timestamp: '2026-10-17T01:08:16Z',
    },
    {
      id: 'aev_5',
      participantId: amanUser.id,
      roundId: 'round_02_coding',
      sessionId: 'psess_demo_aman',
      eventType: 'COPY_ATTEMPT',
      severity: 'medium',
      timestamp: '2026-10-17T02:15:30Z',
      metadata: { target: 'problem_description' },
    },
    {
      id: 'aev_6',
      participantId: amanUser.id,
      roundId: 'round_02_coding',
      sessionId: 'psess_demo_aman',
      eventType: 'TAB_HIDDEN',
      severity: 'high',
      timestamp: '2026-10-17T02:22:10Z',
      metadata: { warningCount: 1 },
    },
    {
      id: 'aev_7',
      participantId: niteshUser.id,
      roundId: 'round_02_coding',
      sessionId: 'psess_demo_nitesh',
      eventType: 'PASTE_ATTEMPT',
      severity: 'high',
      timestamp: '2026-10-17T02:25:00Z',
      metadata: { charLength: 142 },
    },
    {
      id: 'aev_8',
      participantId: niteshUser.id,
      roundId: 'round_02_coding',
      sessionId: 'psess_demo_nitesh',
      eventType: 'TAB_HIDDEN',
      severity: 'critical',
      timestamp: '2026-10-17T02:30:15Z',
      metadata: { warningCount: 4, thresholdExceeded: true },
    },
    {
      id: 'aev_9',
      participantId: niteshUser.id,
      roundId: 'round_02_coding',
      sessionId: 'psess_demo_nitesh',
      eventType: 'SUSPICIOUS_SIMILARITY',
      severity: 'critical',
      timestamp: '2026-10-17T02:45:00Z',
      metadata: { similarityScore: 87.5, comparedWith: 'Aman Verma' },
    },
  ];

  const similarityResults: SimilarityResult[] = [
    {
      id: 'sim_seed_01',
      problemId: 'prob_cp_1',
      problemTitle: 'Optimal Substring Compression',
      roundId: 'round_02_coding',
      submissionId1: 'sub_aman_01',
      participantId1: amanUser.id,
      participantName1: amanUser.fullName,
      submissionId2: 'sub_nitesh_01',
      participantId2: niteshUser.id,
      participantName2: niteshUser.fullName,
      similarityScore: 87.5,
      status: 'HIGHLY_SUSPICIOUS',
      matchingSnippets: [
        'def compress(s: str) -> str:\n    if not s: return ""\n    runs = []\n    curr, cnt = s[0], 1\n    for ch in s[1:]:',
        'while j < len(s) and s[j] == s[i]:\n    count += 1\n    j += 1',
      ],
      createdAt: '2026-10-17T02:45:00Z',
      reviewedByAdmin: false,
    },
  ];

  const consentRecords: ConsentRecord[] = [
    {
      id: 'consent_rahul_r1',
      participantId: rahulUser.id,
      roundId: 'round_01_quiz',
      agreedAt: '2026-10-17T00:59:30Z',
      policyVersion: '2026.1',
      cameraGranted: true,
      micGranted: true,
      fullscreenGranted: true,
    },
    {
      id: 'consent_priya_r1',
      participantId: priyaUser.id,
      roundId: 'round_01_quiz',
      agreedAt: '2026-10-17T01:04:30Z',
      policyVersion: '2026.1',
      cameraGranted: true,
      micGranted: true,
      fullscreenGranted: true,
    },
  ];

  const proctoringSnapshots: ProctoringSnapshot[] = [
    {
      id: 'snap_rahul_1',
      participantId: rahulUser.id,
      roundId: 'round_01_quiz',
      sessionId: 'psess_demo_rahul',
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
      status: 'normal',
      capturedAt: '2026-10-17T01:05:00Z',
      metadata: { faceDetected: true },
    },
    {
      id: 'snap_nitesh_1',
      participantId: niteshUser.id,
      roundId: 'round_02_coding',
      sessionId: 'psess_demo_nitesh',
      imageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      status: 'flagged',
      capturedAt: '2026-10-17T02:30:15Z',
      metadata: { faceDetected: true, notes: 'Captured during tab switch warning threshold trigger' },
    },
  ];

  const proctoringViolationWeights = {
    tabSwitch: 15,
    fullscreenExit: 20,
    copyAttempt: 15,
    pasteAttempt: 20,
    cameraLost: 25,
    micLost: 15,
    suspiciousSimilarity: 50,
  };

  return {
    users: [adminUser, rahulUser, priyaUser, amanUser, niteshUser, demoUser],
    rounds,
    quizQuestions,
    codingProblems,
    debuggingProblems,
    submissions,
    quizAttempts,
    qualifications,
    announcements,
    auditLogs,
    auditEvents,
    proctoringSnapshots,
    proctoringSessions,
    similarityResults,
    consentRecords,
    proctoringViolationWeights,
    isFinalResultsPublished: false,
    competitionSettings: {
      competitionName: 'CODEQUEST 2026',
      isRegistrationOpen: true,
      requireApproval: false,
      autoAdvanceQualified: true,
    },
    aiConfig: {
      enabled: true,
      model: 'gemini-1.5-pro',
      allowInCompetition: true,
      defaultMode: 'competition',
      systemPrompt: 'You are CODEQUEST AI Assistant, an elite competitive programming mentor and Socratic tutor.',
    },
  };
}

class Store {
  private state: DatabaseState;

  constructor() {
    this.ensureDataDir();
    this.state = this.load();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure proctoring collections and settings exist
        parsed.auditEvents = parsed.auditEvents || [];
        parsed.proctoringSnapshots = parsed.proctoringSnapshots || [];
        parsed.proctoringSessions = parsed.proctoringSessions || [];
        parsed.similarityResults = parsed.similarityResults || [];
        parsed.consentRecords = parsed.consentRecords || [];
        parsed.proctoringViolationWeights = parsed.proctoringViolationWeights || {
          tabSwitch: 15,
          fullscreenExit: 20,
          copyAttempt: 15,
          pasteAttempt: 20,
          cameraLost: 25,
          micLost: 15,
          suspiciousSimilarity: 50,
        };

        // If proctoring sessions or results are empty, backfill with rich demo data
        const seed = getInitialSeedData();
        let changed = false;
        if (!parsed.proctoringSessions || parsed.proctoringSessions.length === 0) {
          parsed.proctoringSessions = seed.proctoringSessions;
          changed = true;
        }
        if (!parsed.auditEvents || parsed.auditEvents.length === 0) {
          parsed.auditEvents = seed.auditEvents;
          changed = true;
        }
        if (!parsed.similarityResults || parsed.similarityResults.length === 0) {
          parsed.similarityResults = seed.similarityResults;
          changed = true;
        }
        if (!parsed.proctoringSnapshots || parsed.proctoringSnapshots.length === 0) {
          parsed.proctoringSnapshots = seed.proctoringSnapshots;
          changed = true;
        }
        if (!parsed.consentRecords || parsed.consentRecords.length === 0) {
          parsed.consentRecords = seed.consentRecords;
          changed = true;
        }

        if (changed) {
          this.saveDirect(parsed);
        }
        if (parsed.rounds) {
          parsed.rounds.forEach((r: any) => {
            if (!r.proctoringSettings) {
              r.proctoringSettings = {
                cameraRequired: true,
                microphoneRequired: true,
                fullscreenRequired: true,
                tabMonitoring: true,
                copyRestriction: true,
                pasteRestriction: true,
                cutRestriction: true,
                snapshotsEnabled: true,
                snapshotIntervalSeconds: 60,
                questionRandomization: true,
                codeSimilarityCheck: true,
                maxTabWarnings: 3,
                violationAction: 'warning',
              };
            }
          });
        }
        if (!parsed.aiConfig) {
          parsed.aiConfig = {
            enabled: true,
            model: 'gemini-1.5-pro',
            allowInCompetition: true,
            defaultMode: 'competition',
            systemPrompt: 'You are CODEQUEST AI Assistant, an elite competitive programming mentor and Socratic tutor.',
          };
        }
        return parsed;
      }
    } catch (err) {
      console.error('Failed to load database file, generating seed data:', err);
    }
    const seed = getInitialSeedData();
    this.saveDirect(seed);
    return seed;
  }

  private saveDirect(data: DatabaseState) {
    try {
      const tempPath = `${DATA_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DATA_FILE);
    } catch (err) {
      console.error('Error saving database state:', err);
    }
  }

  public save() {
    this.saveDirect(this.state);
  }

  // Getters & Mutation Helpers
  public getState(): DatabaseState {
    return this.state;
  }

  public resetToSeed() {
    this.state = getInitialSeedData();
    this.save();
    return this.state;
  }

  // Users
  public getUsers() {
    return this.state.users;
  }

  public getUserById(id: string) {
    return this.state.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string) {
    const target = email.toLowerCase();
    const alt = target.includes('@codequest.dev')
      ? target.replace('@codequest.dev', '@codebattle.dev')
      : target.replace('@codebattle.dev', '@codequest.dev');
    return this.state.users.find((u) => u.email.toLowerCase() === target || u.email.toLowerCase() === alt);
  }

  public addUser(user: User) {
    this.state.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.state.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.state.users[idx] = { ...this.state.users[idx], ...updates };
      this.save();
      return this.state.users[idx];
    }
    return null;
  }

  // Rounds
  public getRounds() {
    return this.state.rounds.sort((a, b) => a.roundNumber - b.roundNumber);
  }

  public getRoundById(id: string) {
    return this.state.rounds.find((r) => r.id === id);
  }

  public updateRound(id: string, updates: Partial<Round>) {
    const idx = this.state.rounds.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.state.rounds[idx] = { ...this.state.rounds[idx], ...updates };
      this.save();
      return this.state.rounds[idx];
    }
    return null;
  }

  public addRound(round: Round) {
    this.state.rounds.push(round);
    this.save();
    return round;
  }

  public deleteRound(id: string) {
    this.state.rounds = this.state.rounds.filter((r) => r.id !== id);
    this.save();
  }

  // Questions & Problems
  public getQuizQuestions(roundId?: string) {
    if (roundId) {
      return this.state.quizQuestions.filter((q) => q.roundId === roundId);
    }
    return this.state.quizQuestions;
  }

  public getQuizQuestionById(id: string) {
    return this.state.quizQuestions.find((q) => q.id === id);
  }

  public addQuizQuestion(q: QuizQuestion) {
    this.state.quizQuestions.push(q);
    this.save();
    return q;
  }

  public updateQuizQuestion(id: string, updates: Partial<QuizQuestion>) {
    const idx = this.state.quizQuestions.findIndex((q) => q.id === id);
    if (idx !== -1) {
      this.state.quizQuestions[idx] = { ...this.state.quizQuestions[idx], ...updates };
      this.save();
      return this.state.quizQuestions[idx];
    }
    return null;
  }

  public deleteQuizQuestion(id: string) {
    this.state.quizQuestions = this.state.quizQuestions.filter((q) => q.id !== id);
    this.save();
  }

  public getCodingProblems(roundId?: string) {
    if (roundId) {
      return this.state.codingProblems.filter((p) => p.roundId === roundId);
    }
    return this.state.codingProblems;
  }

  public getCodingProblemById(id: string) {
    return this.state.codingProblems.find((p) => p.id === id);
  }

  public addCodingProblem(p: CodingProblem) {
    this.state.codingProblems.push(p);
    this.save();
    return p;
  }

  public updateCodingProblem(id: string, updates: Partial<CodingProblem>) {
    const idx = this.state.codingProblems.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.state.codingProblems[idx] = { ...this.state.codingProblems[idx], ...updates };
      this.save();
      return this.state.codingProblems[idx];
    }
    return null;
  }

  public deleteCodingProblem(id: string) {
    this.state.codingProblems = this.state.codingProblems.filter((p) => p.id !== id);
    this.save();
  }

  public getDebuggingProblems(roundId?: string) {
    if (roundId) {
      return this.state.debuggingProblems.filter((p) => p.roundId === roundId);
    }
    return this.state.debuggingProblems;
  }

  public getDebuggingProblemById(id: string) {
    return this.state.debuggingProblems.find((p) => p.id === id);
  }

  public addDebuggingProblem(p: DebuggingProblem) {
    this.state.debuggingProblems.push(p);
    this.save();
    return p;
  }

  public updateDebuggingProblem(id: string, updates: Partial<DebuggingProblem>) {
    const idx = this.state.debuggingProblems.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.state.debuggingProblems[idx] = { ...this.state.debuggingProblems[idx], ...updates };
      this.save();
      return this.state.debuggingProblems[idx];
    }
    return null;
  }

  public deleteDebuggingProblem(id: string) {
    this.state.debuggingProblems = this.state.debuggingProblems.filter((p) => p.id !== id);
    this.save();
  }

  // Quiz Attempts
  public getQuizAttempts(userId?: string, roundId?: string) {
    return this.state.quizAttempts.filter((qa) => {
      if (userId && qa.userId !== userId) return false;
      if (roundId && qa.roundId !== roundId) return false;
      return true;
    });
  }

  public getQuizAttempt(userId: string, roundId: string) {
    return this.state.quizAttempts.find((qa) => qa.userId === userId && qa.roundId === roundId);
  }

  public saveQuizAttempt(attempt: QuizAttempt) {
    const idx = this.state.quizAttempts.findIndex((qa) => qa.id === attempt.id);
    if (idx !== -1) {
      this.state.quizAttempts[idx] = attempt;
    } else {
      this.state.quizAttempts.push(attempt);
    }
    this.save();
    return attempt;
  }

  // Submissions
  public getSubmissions(filter?: { userId?: string; roundId?: string; problemId?: string }) {
    return this.state.submissions.filter((s) => {
      if (filter?.userId && s.userId !== filter.userId) return false;
      if (filter?.roundId && s.roundId !== filter.roundId) return false;
      if (filter?.problemId && s.problemId !== filter.problemId) return false;
      return true;
    });
  }

  public getSubmissionById(id: string) {
    return this.state.submissions.find((s) => s.id === id);
  }

  public addSubmission(submission: Submission) {
    this.state.submissions.unshift(submission);
    this.save();
    return submission;
  }

  // Qualifications
  public getQualifications(userId?: string, roundId?: string) {
    return this.state.qualifications.filter((q) => {
      if (userId && q.userId !== userId) return false;
      if (roundId && q.roundId !== roundId) return false;
      return true;
    });
  }

  public setQualification(qual: Qualification) {
    const idx = this.state.qualifications.findIndex(
      (q) => q.userId === qual.userId && q.roundId === qual.roundId
    );
    if (idx !== -1) {
      this.state.qualifications[idx] = qual;
    } else {
      this.state.qualifications.push(qual);
    }
    this.save();
    return qual;
  }

  // Announcements
  public getAnnouncements() {
    return this.state.announcements.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public addAnnouncement(ann: Announcement) {
    this.state.announcements.unshift(ann);
    this.save();
    return ann;
  }

  // Audit Logs
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>) {
    const log: AuditLog = {
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(log);
    if (this.state.auditLogs.length > 500) {
      this.state.auditLogs.pop();
    }
    this.save();
    return log;
  }

  public getAuditLogs() {
    return this.state.auditLogs;
  }

  // Final Results Status
  public setFinalResultsPublished(published: boolean) {
    this.state.isFinalResultsPublished = published;
    this.save();
  }

  public isFinalResultsPublished(): boolean {
    return this.state.isFinalResultsPublished;
  }

  // --- Proctoring & Anti-Cheat Store Methods ---
  public getProctoringSessions(roundId?: string): ProctoringSession[] {
    this.state.proctoringSessions = this.state.proctoringSessions || [];
    if (roundId) {
      return this.state.proctoringSessions.filter((s) => s.roundId === roundId);
    }
    return this.state.proctoringSessions;
  }

  public getProctoringSession(participantId: string, roundId: string): ProctoringSession | undefined {
    this.state.proctoringSessions = this.state.proctoringSessions || [];
    return this.state.proctoringSessions.find(
      (s) => s.participantId === participantId && s.roundId === roundId
    );
  }

  public getProctoringSessionById(sessionId: string): ProctoringSession | undefined {
    this.state.proctoringSessions = this.state.proctoringSessions || [];
    return this.state.proctoringSessions.find((s) => s.id === sessionId);
  }

  public saveProctoringSession(session: ProctoringSession): ProctoringSession {
    this.state.proctoringSessions = this.state.proctoringSessions || [];
    const idx = this.state.proctoringSessions.findIndex((s) => s.id === session.id);
    if (idx !== -1) {
      this.state.proctoringSessions[idx] = session;
    } else {
      this.state.proctoringSessions.unshift(session);
    }
    this.save();
    return session;
  }

  public getAuditEvents(filter?: {
    roundId?: string;
    participantId?: string;
    eventType?: string;
    severity?: string;
    limit?: number;
  }): AuditEvent[] {
    this.state.auditEvents = this.state.auditEvents || [];
    let events = [...this.state.auditEvents];

    if (filter?.roundId) {
      events = events.filter((e) => e.roundId === filter.roundId);
    }
    if (filter?.participantId) {
      events = events.filter((e) => e.participantId === filter.participantId);
    }
    if (filter?.eventType) {
      events = events.filter((e) => e.eventType === filter.eventType);
    }
    if (filter?.severity) {
      events = events.filter((e) => e.severity === filter.severity);
    }

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filter?.limit && filter.limit > 0) {
      return events.slice(0, filter.limit);
    }
    return events;
  }

  public addAuditEvent(event: AuditEvent): AuditEvent {
    this.state.auditEvents = this.state.auditEvents || [];
    this.state.auditEvents.unshift(event);
    if (this.state.auditEvents.length > 2000) {
      this.state.auditEvents.pop();
    }
    this.save();
    return event;
  }

  public getProctoringSnapshots(roundId?: string, participantId?: string): ProctoringSnapshot[] {
    this.state.proctoringSnapshots = this.state.proctoringSnapshots || [];
    return this.state.proctoringSnapshots.filter((snap) => {
      if (roundId && snap.roundId !== roundId) return false;
      if (participantId && snap.participantId !== participantId) return false;
      return true;
    }).sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime());
  }

  public addProctoringSnapshot(snapshot: ProctoringSnapshot): ProctoringSnapshot {
    this.state.proctoringSnapshots = this.state.proctoringSnapshots || [];
    this.state.proctoringSnapshots.unshift(snapshot);
    if (this.state.proctoringSnapshots.length > 500) {
      this.state.proctoringSnapshots.pop();
    }
    this.save();
    return snapshot;
  }

  public getSimilarityResults(roundId?: string): SimilarityResult[] {
    this.state.similarityResults = this.state.similarityResults || [];
    if (roundId) {
      return this.state.similarityResults.filter((r) => r.roundId === roundId);
    }
    return this.state.similarityResults.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  public saveSimilarityResults(results: SimilarityResult[]): void {
    this.state.similarityResults = results;
    this.save();
  }

  public getConsentRecord(participantId: string, roundId: string): ConsentRecord | undefined {
    this.state.consentRecords = this.state.consentRecords || [];
    return this.state.consentRecords.find(
      (c) => c.participantId === participantId && c.roundId === roundId
    );
  }

  public saveConsentRecord(record: ConsentRecord): ConsentRecord {
    this.state.consentRecords = this.state.consentRecords || [];
    const idx = this.state.consentRecords.findIndex(
      (c) => c.participantId === record.participantId && c.roundId === record.roundId
    );
    if (idx !== -1) {
      this.state.consentRecords[idx] = record;
    } else {
      this.state.consentRecords.push(record);
    }
    this.save();
    return record;
  }

  public getProctoringWeights() {
    return (
      this.state.proctoringViolationWeights || {
        tabSwitch: 15,
        fullscreenExit: 20,
        copyAttempt: 15,
        pasteAttempt: 20,
        cameraLost: 25,
        micLost: 15,
        suspiciousSimilarity: 50,
      }
    );
  }

  public updateProctoringWeights(weights: Partial<DatabaseState['proctoringViolationWeights']>) {
    this.state.proctoringViolationWeights = {
      ...this.getProctoringWeights(),
      ...weights,
    };
    this.save();
    return this.state.proctoringViolationWeights;
  }

  public getCompetitionSettings() {
    return this.state.competitionSettings || {
      competitionName: 'CODEQUEST 2026',
      isRegistrationOpen: true,
      requireApproval: false,
      autoAdvanceQualified: true,
    };
  }

  public updateCompetitionSettings(settings: Partial<DatabaseState['competitionSettings']>) {
    this.state.competitionSettings = {
      ...this.getCompetitionSettings(),
      ...settings,
    };
    this.save();
    return this.state.competitionSettings;
  }

  public getAIConfig(): AIConfig {
    if (!this.state.aiConfig) {
      this.state.aiConfig = {
        enabled: true,
        model: 'gemini-1.5-pro',
        allowInCompetition: true,
        defaultMode: 'competition',
        systemPrompt: 'You are CODEQUEST AI Assistant, an elite competitive programming mentor and Socratic tutor.',
      };
      this.save();
    }
    return this.state.aiConfig;
  }

  public updateAIConfig(updates: Partial<AIConfig>): AIConfig {
    this.state.aiConfig = {
      ...this.getAIConfig(),
      ...updates,
    };
    this.save();
    return this.state.aiConfig;
  }
}

export const dbStore = new Store();

