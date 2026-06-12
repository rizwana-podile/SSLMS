const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');
const Course = require('./models/Course');
const Assignment = require('./models/Assignment');
const Job = require('./models/Job');

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let admin = await User.findOne({ email: 'admin@sslms.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@sslms.com',
        password: 'admin123',
        role: 'admin',
      });
      console.log('Admin created: admin@sslms.com / admin123');
    }

    let trainer = await User.findOne({ email: 'trainer@sslms.com' });
    if (!trainer) {
      trainer = await User.create({
        name: 'John Trainer',
        email: 'trainer@sslms.com',
        password: 'trainer123',
        role: 'trainer',
        phone: '9876543210',
      });
      console.log('Trainer created: trainer@sslms.com / trainer123');
    }

    let student = await User.findOne({ email: 'student@sslms.com' });
    if (!student) {
      student = await User.create({
        name: 'Demo Student',
        email: 'student@sslms.com',
        password: 'student123',
        role: 'student',
        phone: '9123456789',
      });
      console.log('Student created: student@sslms.com / student123');
    }

    const courseCount = await Course.countDocuments();
    if (courseCount === 0) {
      const courses = await Course.insertMany([
        {
          title: 'Full Stack Web Development',
          description: 'Learn HTML, CSS, JavaScript, React, Node.js, and MongoDB to build modern web applications.',
          trainer: trainer._id,
          duration: '12 weeks',
          category: 'Web Development',
          content: 'Module 1: HTML & CSS\nModule 2: JavaScript Fundamentals\nModule 3: React.js\nModule 4: Node.js & Express\nModule 5: MongoDB\nModule 6: MERN Project',
          isPublished: true,
        },
        {
          title: 'Data Structures & Algorithms',
          description: 'Master DSA concepts essential for technical interviews and competitive programming.',
          trainer: trainer._id,
          duration: '8 weeks',
          category: 'Computer Science',
          content: 'Arrays, Linked Lists, Stacks, Queues, Trees, Graphs, Sorting, Searching, Dynamic Programming',
          isPublished: true,
        },
        {
          title: 'Python for Data Science',
          description: 'Learn Python, NumPy, Pandas, and data visualization for analytics roles.',
          trainer: trainer._id,
          duration: '10 weeks',
          category: 'Data Science',
          content: 'Python basics, NumPy, Pandas, Matplotlib, Seaborn, basic ML concepts',
          isPublished: true,
        },
      ]);

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      await Assignment.insertMany([
        {
          title: 'Build a Todo App with React',
          description: 'Create a fully functional todo application using React hooks. Include add, delete, and mark-complete features.',
          course: courses[0]._id,
          trainer: trainer._id,
          dueDate,
          maxScore: 100,
        },
        {
          title: 'REST API with Express',
          description: 'Build a REST API with CRUD operations using Express.js and MongoDB.',
          course: courses[0]._id,
          trainer: trainer._id,
          dueDate,
          maxScore: 100,
        },
        {
          title: 'Array Problems Set',
          description: 'Solve 10 array-based coding problems. Submit your solutions with explanations.',
          course: courses[1]._id,
          trainer: trainer._id,
          dueDate,
          maxScore: 50,
        },
      ]);

      console.log('Created 3 courses and 3 assignments');
    }

    const jobCount = await Job.countDocuments();
    if (jobCount === 0) {
      const deadline = new Date();
      deadline.setMonth(deadline.getMonth() + 1);

      await Job.insertMany([
        {
          title: 'Junior Full Stack Developer',
          company: 'TechNova Solutions',
          description: 'We are looking for a passionate full stack developer to join our engineering team. You will work on building scalable web applications using the MERN stack.',
          requirements: 'B.Tech/MCA, knowledge of React and Node.js, good problem-solving skills',
          location: 'Bangalore',
          salary: '4-6 LPA',
          jobType: 'full-time',
          postedBy: admin._id,
          applicationDeadline: deadline,
        },
        {
          title: 'Frontend Developer Intern',
          company: 'StartupHub',
          description: '6-month internship for students learning React. Work on real client projects with mentorship.',
          requirements: 'Currently pursuing B.Tech, basic React knowledge',
          location: 'Remote',
          salary: '15,000/month',
          jobType: 'internship',
          postedBy: admin._id,
          applicationDeadline: deadline,
        },
        {
          title: 'Data Analyst',
          company: 'Analytics Pro',
          description: 'Analyze business data and create reports using Python and SQL. Great opportunity for data science graduates.',
          requirements: 'Python, Pandas, SQL, Excel',
          location: 'Hyderabad',
          salary: '5-7 LPA',
          jobType: 'full-time',
          postedBy: admin._id,
          applicationDeadline: deadline,
        },
      ]);

      console.log('Created 3 job postings');
    }

    console.log('\n--- Demo Accounts ---');
    console.log('Admin:   admin@sslms.com   / admin123');
    console.log('Trainer: trainer@sslms.com / trainer123');
    console.log('Student: student@sslms.com / student123  (use this to enroll, submit, apply)');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
