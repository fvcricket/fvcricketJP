Hey I want to create the cricket scorecard application. This application is mainly intended to use it while practice matches. Usera are manily Mobile users, so design priority is for mobile users.
NOTE: we need to use github pages to develop and deploy and supabase as backend. Updated the anon and project id in the .env file for supabase. Turso db credentials also updated
UI Programming language: ReactJS and corresponding technologies
1. Dynamically we can add the fixtures
2. While scoring we should able to add the players dynamically to the player list along with the players already available in the players list selection.
3. once the innings ends, we should able to handover to the another guest who is scoring on our app with some code to identity the current running match.
4. this application mainly designed with guest users as well
5. only the registered or logged in players can be able to change the score cards.
6. In the top banner we need to keep that "Sponsored By: NC Bulls Cricket Club" and bottom below provide their website url: https://ncbullscricketclub.com
7. Set the color tone very professional, you think like a best UX designer and provide best professinal scorecard experience.
8. As we know, that supabase is faster, so use supabase for users, players profiles and scorecard updates during the matches and once the match marked as end , dump the scorecard into turso DB. Even though it is slowly people can access it easily. Once dump the scorecard to turso db, clean it from supabase, so we can save some space.
9. In the cricket scorecard, as you already know what options include eventhough I keep post few options. Runs: 0,1,2,3 boundaries 4,6 extras: wide+, noball+ (for extras, we need to have the extra plus runs)
======
1. Create all the supabase and turso required queries and tables as required for this cricket scorecard application