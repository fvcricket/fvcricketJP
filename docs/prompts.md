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
2. Create a professional look to our application 
3. Go ahead and create cricket scorecard application
=======
3rd
1. Can design a professional look to our cricket score card application. set the color tone our application to green and yellow
2. when I select start new match, nothing is coming just a white screen, can you check. next I executed the schemas of bith turso and supabase in corresponding DBs. so go ahead and develop our application
======
4th
1. Fixtures, can you provide option to add fixtures and also an option to navigate back to home screen or back page if users needs to go back.
2. Once we add the fixture, provide ooption to add the players to the each team 
3. While adding the fixture provide an option to provide number of overs per team to play. as you know for each over we will have 6 balls.
4. So when we finish the over or legal 6 balls, we should close the over and start new over by selecting the player from bowling team. wide and noball doesn't comes under legal delivery.
5. Then select which team had won toss and elected to bat
6. as well the start adding the run or selecting the runs for each ball, we will aggregate it ti the team total as well
====
1. signed up user trying to login. it is showing in valid credentials
while running supabase, giving error: Error: Failed to run sql query: ERROR: 42P07: relation "profiles" already exists
===
1. remove the email confirmations, because we don't have limit on send emails. so registered user will automatically sign in. 
======
1. Match is getting started. just stopped on loading screen
2. Also where do we add the players to the teams?
===
1. match is getting started, got error: Cannot coerce the result to a single JSON object
2. From the start the match, after I selected the team and toss and bat. nothing is happening on the screen. can you check the funationality
3. Can you provide option to go back in the mobile version.
4. Add some cricket ball as logo and when we click the logo it has to go to the home page