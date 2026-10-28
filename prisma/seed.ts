import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding SpeakVerse database...')

  // 1. Create Demo Users
  const studentPassword = await bcrypt.hash('password123', 10)
  const adminPassword = await bcrypt.hash('admin123', 10)

  const student = await prisma.user.upsert({
    where: { email: 'student@speakverse.dev' },
    update: {},
    create: {
      email: 'student@speakverse.dev',
      name: 'Ravi Teja',
      password: studentPassword,
      role: 'student',
      svProfile: {
        create: {
          displayName: 'Ravi Teja',
          college: 'JNTU College of Engineering, Hyderabad',
          degree: 'B.Tech Computer Science & Engineering',
          targetRole: 'Software Development Engineer',
          learningGoal: 'interview',
          explanationLanguage: 'te_en',
          dailyGoalMinutes: 10,
          onboardingComplete: true,
          assessmentComplete: true,
          selfAssessedLevel: 'B1',
        },
      },
      svRoles: {
        create: {
          role: 'student',
        },
      },
    },
  })

  await prisma.svUserPreference.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      captionsDefault: true,
      audioSpeed: 1.0,
      notifications: true,
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin@speakverse.dev' },
    update: {},
    create: {
      email: 'admin@speakverse.dev',
      name: 'SpeakVerse Administrator',
      password: adminPassword,
      role: 'admin',
      svRoles: {
        create: {
          role: 'administrator',
        },
      },
    },
  })

  // 2. Create Course: English for Placements
  const course = await prisma.svCourse.upsert({
    where: { slug: 'english-for-placements' },
    update: {},
    create: {
      slug: 'english-for-placements',
      title: 'English for Placements',
      description: 'Comprehensive communication training for campus placements, technical interviews, and corporate fluency.',
      targetLevel: 'B1',
      status: 'published',
      version: 1,
      publishedAt: new Date(),
    },
  })

  // 3. Create 3 Modules
  const module1 = await prisma.svModule.create({
    data: {
      courseId: course.id,
      title: 'Foundation & Sentence Mechanics',
      description: 'Grammar confidence, tense consistency, and subject-verb agreement.',
      position: 1,
      status: 'published',
    },
  })

  const module2 = await prisma.svModule.create({
    data: {
      courseId: course.id,
      title: 'Everyday Workplace English',
      description: 'Standups, active listening, technical project descriptions, and email communication.',
      position: 2,
      status: 'published',
    },
  })

  const module3 = await prisma.svModule.create({
    data: {
      courseId: course.id,
      title: 'Interview & Placement Excellence',
      description: 'HR behavioral rounds, technical explanations, and group discussions.',
      position: 3,
      status: 'published',
    },
  })

  // 4. Create 5 Lessons & 15 Activities
  // Lesson 1 (Module 1): Constructing Clear Declarative Sentences
  const lesson1 = await prisma.svLesson.create({
    data: {
      moduleId: module1.id,
      slug: 'clear-declarative-sentences',
      title: 'Constructing Clear Declarative Sentences',
      objective: 'Learn to build clean Subject-Verb-Object sentences without hesitation.',
      difficulty: 'A1',
      estimatedMinutes: 5,
      skill: 'grammar',
      stage: 'foundation',
      status: 'published',
      activities: {
        create: [
          {
            position: 1,
            activityType: 'sentence_reorder',
            skill: 'grammar',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Arrange the words to form a correct affirmative sentence.',
              te: 'సరైన వాక్యంగా పదాలను వరుస క్రమంలో అమర్చండి.',
            }),
            contentJson: JSON.stringify({
              tokens: ['I', 'am', 'studying', 'computer', 'science'],
              hint: 'Start with the subject pronoun "I".',
              feedback: {
                correct: 'Excellent! Subject (I) + Auxiliary (am) + Present Participle (studying) + Object (computer science).',
                incorrect: 'Remember the English sentence structure: Subject + Verb + Object.',
              },
            }),
            answerKeyJson: JSON.stringify({
              correctOrder: ['I', 'am', 'studying', 'computer', 'science'],
            }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 2,
            activityType: 'fill_blank',
            skill: 'grammar',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Fill in the blank with the correct form of the verb.',
              te: 'ఖాళీలో సరైన క్రియ రూపాన్ని రాయండి.',
            }),
            contentJson: JSON.stringify({
              sentence: 'She _____ in the college library every evening.',
              hint: 'Third-person singular present tense requires an -s or -es ending (e.g. studies).',
              feedback: {
                correct: 'Spot on! "She studies" agrees with the singular third-person subject.',
                incorrect: 'For singular subjects (he/she/it), add -s or -ies in simple present.',
              },
            }),
            answerKeyJson: JSON.stringify({
              acceptedAnswers: ['studies', 'reads', 'works'],
            }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 3,
            activityType: 'single_choice',
            skill: 'grammar',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Select the grammatically correct sentence.',
              te: 'వ్యాకరణపరంగా సరైన వాక్యాన్ని ఎంచుకోండి.',
            }),
            contentJson: JSON.stringify({
              prompt: 'Which of the following sentences has correct subject-verb agreement?',
              options: [
                { id: 'a', text: 'The team of engineers is working on the deployment.' },
                { id: 'b', text: 'The team of engineers are working on the deployment.' },
                { id: 'c', text: 'The team of engineers were work on the deployment.' },
              ],
              hint: '"Team" is a collective noun acting as a single unit here.',
              feedback: {
                correct: 'Correct! The singular head noun "The team" takes the singular verb "is".',
                incorrect: 'Careful: the subject is "The team" (singular), not the prepositional phrase "of engineers".',
              },
            }),
            answerKeyJson: JSON.stringify({
              correctId: 'a',
            }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
        ],
      },
    },
  })

  // Lesson 2 (Module 1): Essential Placement Vocabulary
  const lesson2 = await prisma.svLesson.create({
    data: {
      moduleId: module1.id,
      slug: 'placement-vocabulary-foundations',
      title: 'Essential Placement Vocabulary',
      objective: 'Master key corporate terms frequently used in pre-placement talks and interviews.',
      difficulty: 'A2',
      estimatedMinutes: 5,
      skill: 'vocabulary',
      stage: 'foundation',
      status: 'published',
      activities: {
        create: [
          {
            position: 1,
            activityType: 'single_choice',
            skill: 'vocabulary',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Choose the best word for the workplace context.',
              te: 'ఆఫీస్ సందర్భానికి సరిపోయే సరైన పదాన్ని ఎంచుకోండి.',
            }),
            contentJson: JSON.stringify({
              prompt: 'To complete the sprint on time, both developers and testers need to ________ closely.',
              options: [
                { id: 'collab', text: 'collaborate' },
                { id: 'isolate', text: 'isolate' },
                { id: 'postpone', text: 'postpone' },
              ],
              hint: 'Means to work together towards a common goal.',
              feedback: {
                correct: '"Collaborate" means to cooperate and work jointly.',
                incorrect: '"Collaborate" is the proper professional term for joint teamwork.',
              },
            }),
            answerKeyJson: JSON.stringify({ correctId: 'collab' }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 2,
            activityType: 'fill_blank',
            skill: 'vocabulary',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Complete the workplace sentence with the correct term.',
              te: 'సరైన పదంతో వాక్యాన్ని పూరించండి.',
            }),
            contentJson: JSON.stringify({
              sentence: 'We must submit the final code review before Friday\'s _____.',
              hint: 'A word meaning the latest time or date by which something must be completed.',
              feedback: {
                correct: 'Great! "Deadline" is essential workplace vocabulary.',
                incorrect: 'The target word is "deadline".',
              },
            }),
            answerKeyJson: JSON.stringify({ acceptedAnswers: ['deadline', 'milestone', 'cutoff'] }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 3,
            activityType: 'sentence_reorder',
            skill: 'vocabulary',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Arrange the sentence describing a project achievement.',
              te: 'ప్రాజెక్ట్ సాధించిన ఫలితాన్ని తెలిపే వాక్యాన్ని క్రమంలో పెట్టండి.',
            }),
            contentJson: JSON.stringify({
              tokens: ['Our', 'team', 'built', 'a', 'scalable', 'web', 'application'],
              hint: 'Start with possessive "Our team".',
              feedback: {
                correct: 'Spot on! A strong, active-voice sentence for resumes and interviews.',
                incorrect: 'Assemble: Our team built a scalable web application.',
              },
            }),
            answerKeyJson: JSON.stringify({
              correctOrder: ['Our', 'team', 'built', 'a', 'scalable', 'web', 'application'],
            }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
        ],
      },
    },
  })

  // Lesson 3 (Module 2): Active Listening in Engineering Standups
  const lesson3 = await prisma.svLesson.create({
    data: {
      moduleId: module2.id,
      slug: 'active-listening-standups',
      title: 'Active Listening in Engineering Standups',
      objective: 'Identify action items, blockers, and timelines in daily team sync meetings.',
      difficulty: 'B1',
      estimatedMinutes: 6,
      skill: 'listening',
      stage: 'everyday',
      status: 'published',
      activities: {
        create: [
          {
            position: 1,
            activityType: 'listening_mcq',
            skill: 'listening',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Listen to the audio update and answer the comprehension question.',
              te: 'ఆడియో అప్‌డేట్ విని సరైన సమాధానాన్ని ఎంచుకోండి.',
            }),
            contentJson: JSON.stringify({
              prompt: 'Yesterday I finished the authentication flow, but today I am blocked by the database migration script.',
              options: [
                { id: 'done', text: 'The engineer is blocked by the database migration script.' },
                { id: 'auth', text: 'The engineer is still writing authentication flow.' },
                { id: 'all_good', text: 'There are no blockers today.' },
              ],
              hint: 'Listen for the word "blocked".',
              feedback: {
                correct: 'Exactly right! Identifying blockers is the main purpose of daily standups.',
                incorrect: 'Notice the transition: "...but today I am blocked by the database migration script."',
              },
            }),
            answerKeyJson: JSON.stringify({ correctId: 'done' }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 2,
            activityType: 'fill_blank',
            skill: 'listening',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Type the key blocker term you hear in sprint meetings.',
              te: 'స్ప్రింట్ మీటింగ్‌లలో తరచూ వినే కీలక పదాన్ని టైప్ చేయండి.',
            }),
            contentJson: JSON.stringify({
              sentence: 'If anyone has an impediment, please raise it as a _____ immediately.',
              hint: 'Synonym for obstacle or impediment in agile.',
              feedback: {
                correct: 'Correct! A "blocker" stops progress.',
                incorrect: 'The standard term in agile standups is "blocker".',
              },
            }),
            answerKeyJson: JSON.stringify({ acceptedAnswers: ['blocker', 'ticket', 'issue'] }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 3,
            activityType: 'single_choice',
            skill: 'listening',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Choose the most professional clarification question.',
              te: 'సందేహం ఉన్నప్పుడు గౌరవప్రదంగా అడగడానికి సరైన వాక్యాన్ని ఎంచుకోండి.',
            }),
            contentJson: JSON.stringify({
              prompt: 'If you did not catch what a teammate said during a meeting, what is the best way to ask?',
              options: [
                { id: 'polite', text: 'Could you please repeat the last point regarding the API deadline?' },
                { id: 'blunt', text: 'What did you say? I didn\'t listen.' },
                { id: 'ignore', text: 'Say nothing and guess later.' },
              ],
              hint: 'Professional requests use modal verbs like "Could" or "Would".',
              feedback: {
                correct: 'Polite, clear, and specifies which point needed repetition.',
                incorrect: 'Use "Could you please repeat..." for polite workplace etiquette.',
              },
            }),
            answerKeyJson: JSON.stringify({ correctId: 'polite' }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
        ],
      },
    },
  })

  // Lesson 4 (Module 2): Spoken Fluency: Describing Your Project
  const lesson4 = await prisma.svLesson.create({
    data: {
      moduleId: module2.id,
      slug: 'spoken-fluency-project',
      title: 'Spoken Fluency: Describing Your Project',
      objective: 'Deliver a concise 60-second explanation of an engineering project with structured flow.',
      difficulty: 'B1',
      estimatedMinutes: 7,
      skill: 'speaking',
      stage: 'fluency',
      status: 'published',
      activities: {
        create: [
          {
            position: 1,
            activityType: 'sentence_reorder',
            skill: 'speaking',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Reconstruct the project impact sentence.',
              te: 'ప్రాజెక్ట్ ప్రభావం వివరించే వాక్యాన్ని అమర్చండి.',
            }),
            contentJson: JSON.stringify({
              tokens: ['The', 'optimized', 'query', 'reduced', 'response', 'time', 'significantly'],
              hint: 'Start with "The optimized query".',
              feedback: {
                correct: 'Strong technical phrasing emphasizing optimization and quantifiable impact.',
                incorrect: 'Arrange: The optimized query reduced response time significantly.',
              },
            }),
            answerKeyJson: JSON.stringify({
              correctOrder: ['The', 'optimized', 'query', 'reduced', 'response', 'time', 'significantly'],
            }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 2,
            activityType: 'fill_blank',
            skill: 'speaking',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Fill in the transition phrase for technical explanations.',
              te: 'వివరణలలో ఉపయోగించే అనుసంధాన పదాన్ని రాయండి.',
            }),
            contentJson: JSON.stringify({
              sentence: '_____ to addressing the front-end redesign, we also optimized API caching.',
              hint: 'Means besides or along with (In _____ to).',
              feedback: {
                correct: '"In addition to" is an impactful transition phrase.',
                incorrect: 'The phrase is "In addition to".',
              },
            }),
            answerKeyJson: JSON.stringify({ acceptedAnswers: ['in addition', 'addition'] }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 3,
            activityType: 'single_choice',
            skill: 'speaking',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Identify the strongest technical pitch opening.',
              te: 'ప్రాజెక్ట్ వివరణను ప్రారంభించడానికి ఉత్తమమైన వాక్యాన్ని ఎంచుకోండి.',
            }),
            contentJson: JSON.stringify({
              prompt: 'Which opening sentence creates the strongest impression when explaining your final year project?',
              options: [
                { id: 'impact', text: 'My project addresses patient queue bottlenecks in hospitals through real-time triage prediction.' },
                { id: 'weak', text: 'I basically made an app because my professor told us to pick something with Python.' },
                { id: 'vague', text: 'It is a website that does various things with data.' },
              ],
              hint: 'Focus on the problem solved and domain value.',
              feedback: {
                correct: 'Focusing on the problem and solution immediately captures the interviewer\'s interest.',
                incorrect: 'Highlight the core problem and real-world value right away.',
              },
            }),
            answerKeyJson: JSON.stringify({ correctId: 'impact' }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
        ],
      },
    },
  })

  // Lesson 5 (Module 3): Mastering the STAR Method for HR Rounds
  const lesson5 = await prisma.svLesson.create({
    data: {
      moduleId: module3.id,
      slug: 'star-method-hr-rounds',
      title: 'Mastering the STAR Method for HR Rounds',
      objective: 'Structure behavioral answers using Situation, Task, Action, and Result.',
      difficulty: 'B2',
      estimatedMinutes: 8,
      skill: 'interview',
      stage: 'interview_excellence',
      status: 'published',
      activities: {
        create: [
          {
            position: 1,
            activityType: 'single_choice',
            skill: 'interview',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Identify the STAR component.',
              te: 'STAR పద్ధతిలోని విభాగాన్ని గుర్తించండి.',
            }),
            contentJson: JSON.stringify({
              prompt: 'In the sentence: "As a result, page load time decreased by 40% and user retention improved by 15%", which STAR component is demonstrated?',
              options: [
                { id: 'r', text: 'Result (quantifiable outcome)' },
                { id: 's', text: 'Situation (background context)' },
                { id: 't', text: 'Task (assigned responsibility)' },
              ],
              hint: 'Look for percentages and measurable improvements.',
              feedback: {
                correct: 'Correct! Quantifiable metrics demonstrate the "Result" (R).',
                incorrect: 'Numbers, percentages, and business impact correspond to Result (R).',
              },
            }),
            answerKeyJson: JSON.stringify({ correctId: 'r' }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 2,
            activityType: 'sentence_reorder',
            skill: 'interview',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Reconstruct the leadership action sentence.',
              te: 'నాయకత్వ లక్షణాన్ని వివరించే వాక్యాన్ని అమర్చండి.',
            }),
            contentJson: JSON.stringify({
              tokens: ['I', 'coordinated', 'tasks', 'across', 'three', 'different', 'subteams'],
              hint: 'Start with "I coordinated".',
              feedback: {
                correct: 'Strong action verb: "coordinated" exhibits proactive leadership.',
                incorrect: 'Arrange: I coordinated tasks across three different subteams.',
              },
            }),
            answerKeyJson: JSON.stringify({
              correctOrder: ['I', 'coordinated', 'tasks', 'across', 'three', 'different', 'subteams'],
            }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
          {
            position: 3,
            activityType: 'fill_blank',
            skill: 'interview',
            status: 'published',
            instructionsI18n: JSON.stringify({
              en: 'Complete the STAR acronym definition.',
              te: 'STAR పద్ధతి నిర్వచనాన్ని పూర్తి చేయండి.',
            }),
            contentJson: JSON.stringify({
              sentence: 'In the STAR framework, the letter S stands for _____.',
              hint: 'The background context or problem scenario.',
              feedback: {
                correct: 'Yes! Situation sets the stage for your answer.',
                incorrect: 'S stands for "Situation".',
              },
            }),
            answerKeyJson: JSON.stringify({ acceptedAnswers: ['situation', 'the situation'] }),
            scoringConfig: JSON.stringify({ maxPoints: 10, hintPenalty: 2, rubricVersion: '1.0' }),
          },
        ],
      },
    },
  })

  // 5. Add initial skill evidence & progress for demo student
  await prisma.svLessonProgress.upsert({
    where: {
      userId_lessonId: {
        userId: student.id,
        lessonId: lesson1.id,
      },
    },
    update: {},
    create: {
      userId: student.id,
      lessonId: lesson1.id,
      status: 'completed',
      completedAt: new Date(),
    },
  })

  await prisma.svSkillEvidence.createMany({
    data: [
      { userId: student.id, skill: 'grammar', evidenceType: 'assessment', rubricVersion: '1.0', score: 85, maxScore: 100, confidence: 0.9 },
      { userId: student.id, skill: 'vocabulary', evidenceType: 'assessment', rubricVersion: '1.0', score: 90, maxScore: 100, confidence: 0.9 },
      { userId: student.id, skill: 'speaking', evidenceType: 'assessment', rubricVersion: '1.0', score: 70, maxScore: 100, confidence: 0.8 },
      { userId: student.id, skill: 'listening', evidenceType: 'assessment', rubricVersion: '1.0', score: 85, maxScore: 100, confidence: 0.9 },
      { userId: student.id, skill: 'writing', evidenceType: 'assessment', rubricVersion: '1.0', score: 75, maxScore: 100, confidence: 0.85 },
      { userId: student.id, skill: 'interview', evidenceType: 'assessment', rubricVersion: '1.0', score: 68, maxScore: 100, confidence: 0.8 },
    ],
  })

  console.log('Seeding completed successfully!')
  console.log('Demo student account: student@speakverse.dev / password123')
  console.log('Demo admin account: admin@speakverse.dev / admin123')
}

main()
  .catch((e) => {
    console.error('Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
