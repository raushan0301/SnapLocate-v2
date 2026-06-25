import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function seedFaqs() {
  const faqs = [
    {
      category: 'General',
      question: 'How do I change my password?',
      answer: 'You can change your password by going to Settings > Security and clicking on "Change Password". Make sure to use a strong password.',
      sort_order: 1
    },
    {
      category: 'General',
      question: 'Is my data secure on SnapLocate?',
      answer: 'Yes, SnapLocate uses industry-standard encryption for data at rest and in transit. Only authorized users with a valid university email can access the internal platform.',
      sort_order: 2
    },
    {
      category: 'General',
      question: 'How do I clear my notification history?',
      answer: 'You can swipe right on any notification to delete it instantly. Alternatively, older notifications are automatically cleared after 60 days.',
      sort_order: 3
    },
    {
      category: 'General',
      question: 'What browsers are officially supported?',
      answer: 'SnapLocate works best on the latest versions of Google Chrome, Mozilla Firefox, Safari, and Microsoft Edge.',
      sort_order: 4
    },
    {
      category: 'Student',
      question: 'How can I contact a professor for office hours?',
      answer: 'Go to the "Professors" directory, find your professor, and click "Book Appointment" or "Request Office Hours". They will receive a direct notification.',
      sort_order: 5
    },
    {
      category: 'Student',
      question: 'How do I sell an item on the Campus Marketplace?',
      answer: 'Navigate to the Marketplace and click the "Sell Item" button in the header. Fill in the details, upload photos, and set your price to make it live instantly.',
      sort_order: 6
    },
    {
      category: 'Faculty',
      question: 'Can I manage my timetable on this platform?',
      answer: 'Yes, your teaching schedule and office hours are synced automatically. You can view them in the Dashboard under "Teaching Schedule" or your Profile.',
      sort_order: 7
    },
    {
      category: 'Faculty',
      question: 'How do I approve student requests?',
      answer: 'Go to the Faculty Dashboard. In the "Student Requests" section, you can quickly accept or reject incoming office hour or mentoring requests.',
      sort_order: 8
    }
  ];

  for (const faq of faqs) {
    const { error } = await supabaseAdmin.from('support_faqs').insert(faq);
    if (error) {
      console.error('Error inserting FAQ:', faq.question, error.message);
    } else {
      console.log('Inserted FAQ:', faq.question);
    }
  }
}

seedFaqs().then(() => process.exit(0));
