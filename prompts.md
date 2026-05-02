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


=======
1. Show or add the score to the batsmen and bowler
2. also the score card as like current batsmen and bowler
3. Here we will have two tabs, one current running score and another is scorecard, where automatically updates the scores of each batsmen and bowlers
4. provide an option to save the score card for the match
5. wicket option is missing to sent out or record the batsmen got out. So, when we record the wicket, provide how the  player got out.
6. As we said earlier, current running scorecard will be using the supabase and after match ended, we will save this score card to turso db, temporarily if we need to have or restore the score we will use supabase DB only. we will only keep for 7 days temporarily in supabase
7. Can use `/Users/kumargurijala/Documents/cricket/scorecard/fvcricketJP/public/cricket_playing.png` as the icon of the app, if possible use this image even in the background.
8. visit NC Bulls Cricket Club, --> open this in the browser in new tab instead of same window.
9. <span className="text-sm font-semibold">Sponsored By</span> use this in the footer. move the visit NC Bulls Cricket Club to the footer of the mobile screen
========
1. Logo is working
2. set up the github pages and  actions to deploy automatically when it is pushed to `main` branch
3. Score card has to be shown team wise instead of single score card
4. IN the score card, show the headings like player, runs, balls, 4s/6s, Dismissed
5. In the current score move the current over to the top bewlo the scores
6. in the dropdown of striker, non-striker and bowler fields, can you show gray color text to the right of the field what field it represents?
7. when we save - `Scorecard saved in Supabase. Turso archive will be retried later.` change to `score card saved` that's it.
8. innings should end when the designed overs of the match like here in 7 over matchs that means each will play 7 overs. so we need to introduce innings end and also end match option as well
======
1. let build this as an app like having the navigation panel. naviagation options like fixtures, scorecards. Add your own icons
2. Plan a admin panel to manage the scorecards like deleting. 
3. Make sure we should not allow more than one score card to resume scoring for a fixture cricket match.

Design and implement like professional UI engineer
========
1. Move the navigation menu to the top of the screen below the banner.
2. keep the sponsored by banner at the bottom of the screen in the mobile version.
3. when start the match, it showing the team and option to add players. but it not shwoing already added players, can you fix it?
4. saved scorecards are not shwoing any data in the scorecard tab, just empty scorecards.
5. In the scorecard along with current score and scorecard, can you add commentary as well. Here add what happened for each ball in the over. 

implement like best professional UI/UX engineer

=====
1. Error showing `Could not embed because more than one relationship was found for 'scorecard' and 'players'`
2. Admin feature is missing
====
1. In the mobile version, fixtures buttons are huge, redesign complete layout and buttons in the mobile 
2. when wide and no ball selected you should ask for additional runs as well, it missing  now
3. After all the over are done for both inngings, end match button is disabled, can you enable it to end the match?
4. When I hit the view score card, empty cards are showing, if we have issues with turso db. Let's keep only supabase db. Single supabase DB.
=======


1. 