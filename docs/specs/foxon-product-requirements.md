# Foxon — Product Requirements Document

## 1. Elevator Pitch
Foxon is a mobile-optimized web app for self-trained gym goers who follow pre-written programs. It makes logging workouts seamless, programming simple, and reviewing progress effortless. By turning training into a narrative of consistency and growth, Foxon helps users stay intentional and feel every workout as part of a bigger story of transformation.

## 2. Who is this app for
- **Primary audience**: Intermediate self-trained lifters  
- **Context**: They already have a program (e.g., from a coach or text file) and want to track it reliably.  
- **Motivations**: Consistency, progress tracking, accountability, and reflection.  
- **Frustrations with alternatives**: Existing apps are either too complicated, too generic, or lack reflection elements.  

## 3. Functional Requirements
### Exercise Library
- Create, edit, delete exercises  
- Fields: name, description, muscle group (predefined list), equipment (optional, predefined), icon  

### Workouts & Programming
- Compose workouts from personal exercise library  
- Configure sets: load, rep target, set type (Warm-up, Normal)  
- Attach exercise notes  

### Workout Logging
- Start from pre-created workout  
- Add/remove sets dynamically during session  
- Mark set type (Warm-up, Normal)  
- Inline view of previous session values for each exercise  
- Save workout with finish flow (review/edit duration, volume, sets)  

### Session Seal
- After finishing a workout, users are prompted to:  
  - **Rate Effort**: Apple Fitness–style intensity scale (Easy → Moderate → All-In)  
  - **Add Reflection**: Short required note (mood, insights, takeaways)  
  - **Name Session**: Optional title (e.g., "Leg Day PR")  
- Stored Session Seal becomes part of later analysis and narrative tracking  

### Account & Preferences
- Social signup/login (OAuth)  
- Basic profile: display name + avatar  

### Review & Stats
- Calendar view of completed workouts  
- Per-exercise history: date, volume, load, sets over time  
- Session Seals displayed with effort + reflections  

## 4. User Stories
- **As a lifter**, I want to create my own exercise library so my workouts reflect the way I train.  
- **As a user**, I want to build workouts from my program so I don’t need to rethink structure each session.  
- **As a trainee**, I want to log workouts quickly, adjusting sets as needed, so my tracking stays accurate to real-life training.  
- **As a user**, I want to see my previous session’s numbers inline, so I know whether I’m progressing.  
- **As a lifter**, I want to complete each workout with an effort rating and reflection so I capture both data and how it felt.  
- **As a user**, I want to see my progress over time (calendar and per-exercise stats) so I can plan future workouts with confidence.  

## 5. User Interface
- **Visual style**: Clean, minimalist, colorful highlights inspired by Whering. Friendly and motivating tone.  
- **Home screen**: Quick actions (Upload/Create Workouts, Start Workout, View Stats).  
- **Workout logging**: Hevy-style interface with inline set tracking, rest timers, and check-off interaction.  
- **Session completion**: Effort rating slider, short reflection field, optional session name. Review of duration, volume, sets before saving.  
- **Calendar view**: Visual history of workouts with icons + effort indicators, clickable to see details.  
- **Profile & preferences**: Avatar, privacy settings, and simple account controls.  
