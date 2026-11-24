import { PresetQuestion } from '../types';

export const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: 'creator',
    questionBn: 'এটা কে বানিয়েছে?',
    questionAlt: 'Aita ke baniyechhe?',
    presetAnswer: 'Saiful Sir — এটি বানিয়েছেন Saiful Sir।',
  },
  {
    id: 'turn-off',
    questionBn: 'এটা অফ করবো কিভাবে?',
    questionAlt: 'Aita off korbo kivabe?',
    presetAnswer:
      'একটি পাসওয়ার্ড আমাকে দিন, আমি আনলক করে দিচ্ছি। সঠিক পাসওয়ার্ড টাইপ করলে ওভারলে বন্ধ হয়ে যাবে এবং অ্যাপ স্টপ হয়ে যাবে।',
    triggersUnlockPrompt: true,
  },
  {
    id: 'capabilities',
    questionBn: 'তুমি কী কী করতে পারো?',
    questionAlt: 'Tumi ki ki korte paro?',
    presetAnswer:
      'আমি আপনার সাথে বাংলা, বাংলিশ ও ইংরেজিতে যেকোনো বিষয়ে কথা বলতে পারি, প্রশ্নের উত্তর দিতে পারি এবং পড়াশোনা বা দৈনন্দিন কাজে সাহায্য করতে পারি। আপনি নিচে আপনার মনের মতো যেকোনো প্রশ্ন লিখতে পারেন।',
  },
  {
    id: 'fun-talk',
    questionBn: 'আমাকে একটি অনুপ্রেরণামূলক কথা বলো',
    questionAlt: 'Give me a motivational thought',
    presetAnswer:
      'প্রতিদিন একটু একটু করে শিখতে থাকলে অসম্ভব কাজও সহজ হয়ে যায়। আপনার লক্ষ্য ঠিক রাখুন এবং থেমে যাবেন না!',
  },
];
