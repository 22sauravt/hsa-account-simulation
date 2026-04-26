# AI Usage — HSA Account Simulation

I used AI extensively throughout this project, while making sure I was an active user. I have developed an AI workflow while working with coding tools in the past, which boils down to providing full context, reviewing architectural plans, creating implementation plans, and executing them piece by piece / via agents. I used this process throughout my development for this project, which dramatically sped up my production cycle and improved my results. 
## Tools Used

- **Antigravity (Google DeepMind) + Claude Code CLI** — I used these exclusively throughout the project. Claude Code is good for initial architectural plans due to its large context window and high reasoning abilities. On the flipside, this also means it uses many more tokens. To prioritize my usage of Claude, I used the less intensive Antigravity for parts of the coding, and especially when fixing bugs (as this may require repeated queries). Claude Code being run in my terminal and Antigravity as the IDE made for a productive workflow.

## How AI Helped

### Architecture & Planning
I had a general understanding of the architecture and tools used here - React for frontend, Nodejs for backend, and SQLite for database. I used this to prompt the AI to build a system, while also asking it if my tech stack was a good option for a take-home project to be built in 24 hours. As I do with any piece of code I write noawadays, I asked Antigravity to create an architecture plan, which I manually approved and then asked it to make the architecture.md file. I then reviewed this file as well. I believe that AI is extremely valuable in helping with architectural decisions for small projects, perhaps even more so than with coding. 

### Code Generation
AI generated the initial codebase including the Express backend (routes, services, database setup) and React frontend (components, hooks, CSS design system). I reviewed each file before integration, and any changes were made using AI. There were some api errors which I actively debugged with AI as they were more complex. 

### Testing & Verification
I used AI to create a suite of tests. I gave it a prompt of how to create a singular test for the different aspects to verify, and then had it write scripts to generate them. These tests were designed to verify the following things:
- Account creation and deposit flows
- Transaction approval for qualified medical expenses
- Transaction decline for non-qualified merchants
- Concurrency correctness 

## Representative Prompts / Workflows

### 1. Initial Design + Code
**Prompt:** Context provided was the full assignment requirements, and I reinforced that this assignemnt must be completed in 24 hours - an MVP should be built hitting all requirements. I asked the AI to build a design plan and then architecture.md. I reviewed architecture.md and asked it to follow it strictly to build the first version of the codebase. 

### 2. UI Design System
**Prompt:** (Part of the approved plan execution)

**Workflow:** AI created a comprehensive CSS design system with dark mode, glassmorphism, and micro-animations. I reviewed the visual output in-browser and confirmed it met the premium design standard — dark navy backgrounds, teal/cyan gradient accents, glass-effect cards with subtle borders, and smooth transitions.

**Issue:** The AI-generated `server/index.js` mounted the transaction router at **two different prefixes** to handle both `/api/transactions` (for POST) and `/api/accounts/:id/transactions` (for GET history):

```js
app.use('/api/transactions', transactionRoutes);
app.use('/api', transactionRoutes);
```

This created a route collision — the `POST /` handler inside the transaction router would match **both** `POST /api/transactions` and `POST /api/`. In practice, this meant that any POST to `/api/` (or paths like `/api/accounts`) could accidentally fall through to the transaction handler if the body happened to pass validation.

**How I fixed it:** I identified this during code review of the route mounting and realized the root cause was that the AI tried to keep all transaction-related routes in one file but needed them at different URL prefixes. I used AI's assistance to help approach this problem instead of using it to fix it since Antigravity repeatedly spiraled when trying to process the list of API calls. 

To remove the double-mount I split the routes into two files: one for transactions and one for categories. I then mounted each router once at its dedicated mount point. This made the route structure far better.

## How I Verified the Final Implementation

I ran my suite of tests that verify correctness in the backend. Since concurrency was one of the more invovled aspects of this assignment, I manually tested concurrency multiple times, making sure concurrent transactions are properly handled. For the frontend, I tested all buttons and components of the project. 


