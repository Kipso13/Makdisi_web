# Brightpath Campus Community

Build a Modern High School Student Platform

Create a complete, modern, responsive web application for a high school. The platform should be a central digital space where students can access school information, track their academic performance, check their attendance, communicate with teachers, and share educational content.

The website should look and feel like a premium, professionally developed product, not a basic school website.

1. Design & Visual Identity

Create a beautiful, modern UI with a minimalist aesthetic.

Color palette:

Primary: Black (#080B12)

Secondary: White (#FFFFFF)

Dark blue (#101C35)

Electric blue (#2563EB)

Light blue (#60A5FA)

Soft blue gradients for backgrounds and interactive elements.

Use subtle grey tones for secondary text and borders.

Design requirements:

Modern dashboard design inspired by premium SaaS platforms.

Smooth animations and transitions between pages.

Beautiful hover effects on buttons, cards and navigation elements.

Smooth page transitions.

Subtle glowing blue effects.

Rounded cards with elegant shadows.

Modern typography (Inter, Poppins or similar).

Clean icons (Lucide icons).

Beautiful loading animations and skeleton screens.

Responsive design for desktop, tablets and smartphones.

Dark mode and light mode.

Avoid excessive animations. Keep everything smooth and professional.

The website should make students enjoy using it every day.

2. Authentication & Student Accounts

Create a complete authentication system.

Features:

Student registration and login.

Individual accounts for every student.

Secure password authentication.

Forgot password functionality.

Student profile with profile picture.

Personal information and academic details.

Each student should only access their own private academic information.

Different account roles:

Student

Teacher

Administrator

After logging in, redirect each user to a personalized dashboard depending on their role.

3. Personalized Student Dashboard

Create a dashboard that displays information based on the student's academic year and personal account.

Display:

Student's name and profile picture.

Academic year and class.

School announcements.

Upcoming exams.

Upcoming assignments.

Latest grades.

Attendance statistics.

Total hours of absence.

Recent teacher messages.

Educational videos recommended for the student's level.

The dashboard must automatically adapt to the student's academic level.

For example:
A student in 1ère Bac should receive information relevant to 1ère Bac, while a student in 2ème Bac should receive information relevant to 2ème Bac.

4. Attendance & Absence Management

Create a complete attendance tracking section.

Students should be able to:

View their attendance history.

See the dates they were absent.

See the number of missed hours.

View late arrivals.

Check whether an absence is justified or unjustified.

See their total absence hours.

View attendance statistics using charts.

Teachers and administrators should be able to:

Record student absences.

Record late arrivals.

Update attendance records.

Add comments or explanations.

Filter attendance by class, student, date and academic year.

Display attendance information using clean charts and statistics.

5. Academic Performance & Grades

Create a dedicated academic section.

Students should be able to:

View their grades for every subject.

See their average in each subject.

See their overall average.

View their academic progress over time.

Compare their current performance with previous assessments.

Receive personalized academic feedback.

Teachers should be able to:

Add and update grades.

Assign grades to individual students.

Add comments and feedback.

Organize grades by subject, semester and examination.

Use interactive charts to visualize academic progress.

6. Teacher Communication System

Create a messaging system that allows students to communicate directly with their teachers.

Features:

Private messaging between students and teachers.

Conversations organized by teacher.

Message notifications.

Ability to send text messages.

Share documents and homework files.

Teacher announcements.

A clean chat interface inspired by modern messaging applications.

Students must only be able to contact teachers and access conversations they are authorized to see.

7. Educational Video & Student Community

Create a dedicated community section where students can share educational content.

Features:

Upload and share educational videos.

Share study tips and learning resources.

Organize content by subject.

Like and comment on posts.

Save useful videos.

Follow educational topics.

Discover popular educational content.

Search videos by subject or academic level.

Create a modern social-media-inspired interface, but focused entirely on education and studying.

Include categories such as:

Mathematics

Physics and Chemistry

Biology and Geology (SVT)

Languages

History and Geography

Computer Science

Study Techniques

Exam Preparation

Include moderation tools so administrators can remove inappropriate content.

8. School Information & Announcements

Create a school information center.

Display:

General school announcements.

Important dates.

Examination schedules.

School holidays.

Timetables.

School events.

Important documents.

Administrative announcements.

Allow administrators to publish announcements and target specific classes or academic years.

9. Smart Search & Notifications

Add:

Global search functionality.

Notifications for new messages.

Notifications when new grades are published.

Absence notifications.

Upcoming exam reminders.

New school announcements.

Notifications when someone interacts with a student's educational posts.

10. Administrator Dashboard

Create a powerful administration panel.

Administrators should be able to:

Manage student accounts.

Create and manage classes.

Assign students to academic years.

Manage teacher accounts.

Manage subjects.

Manage timetables.

Record and edit attendance.

Manage grades.

Publish announcements.

Moderate educational content.

View statistics about the entire school.

Include filtering, sorting, search and data visualization.

11. Technology & Architecture

I initially prefer:

HTML5 for structure.

CSS3 for styling.

JavaScript for interactivity.

However, you can use additional technologies when necessary to make the application professional, scalable and functional.

Recommended stack:

Frontend: React with TypeScript.

Styling: Tailwind CSS.

Animations: Framer Motion.

Icons: Lucide React.

Backend: Supabase.

Database: PostgreSQL through Supabase.

Authentication: Supabase Auth.

File and video storage: Supabase Storage.

Use a properly structured and maintainable codebase.

Important: This must be a real functional application, not just a frontend prototype. Implement database integration, authentication, permissions and actual data persistence.

12. Database Structure

Create a well-organized database with tables for:

Students

Teachers

Administrators

Classes

Academic years

Subjects

Grades

Attendance

Timetables

Messages

Conversations

Announcements

Educational posts

Videos

Comments

Likes

Notifications

Implement appropriate database relationships and security policies.

Students must never be able to access another student's private grades, attendance records or private messages.

13. Important User Experience Requirements

Make navigation intuitive and easy.

Add a beautiful sidebar navigation on desktop.

Use a modern mobile navigation system.

Add meaningful empty states when no information is available.

Add confirmation dialogs for important actions.

Display success and error messages.

Include realistic demo data to demonstrate the platform.

Make every button and feature functional.

Never leave important buttons as decorative elements.

Do not expose private student information publicly.

14. Final Goal

I want this project to look like a combination of:

A premium student management platform.

A modern academic dashboard.

An educational social network.

A communication platform between students and teachers.

The result should be visually impressive, technically functional, easy to use, and suitable for presenting as a serious high school technology project.

Start by building the complete design system and core application structure. Then implement the authentication, database, student dashboard, attendance, grades, messaging, educational community and administration features.

Prioritize excellent design, smooth user experience, security and real functionality.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/764e6259-2cc2-544b-9b15-5c28754fb77f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
