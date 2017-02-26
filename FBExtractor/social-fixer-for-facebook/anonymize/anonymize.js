// ========================================================
// Anonymize Screens
// ========================================================
X.ready( 'anonymize', function() {
	// Add a menu item
	var item = {"html":"Anonymize Screen","message":"menu/anonymize", "tooltip":"Anonymize the current screen to make it suitable for screenshots to be shared without showing friends' names"};
	X.publish('menu/add',{"section":"actions", "item":item});
	X.publish('post/action/add', {"section": "wrench", "label": "Anonymize Post", "message": "post/action/anonymize"});

	// This function gets fired when the menu item is clicked
	X.subscribe("menu/anonymize",function() {
		anonymize(document);
	});
	X.subscribe("post/action/anonymize", function(msg,data) {
		anonymize(X("#"+data.id));
	});

	var anonymize = function(context) {
		var namehash = {};
		var colorhash = {};
		var colorcount = 1;
		var namecount = 1;
		var grouphash = {};
		var groupcount = 1;
		var eventhash = {};
		var eventcount = 1;
		var anon_names = ["Mario Speedwagon","Anna Sthesia","Paul Molive","Anna Mull","Paige Turner","Bob Frapples","Walter Melon","Nick R. Bocker","Barb Ackue","Buck Kinnear","Greta Life","Ira Membrit","Shonda Leer","Brock Lee","Maya Didas","Rick O'Shea","Pete Sariya","Sal Monella","Sue Vaneer","Cliff Hanger","Barb Dwyer","Terry Aki","Cory Ander","Robin Banks","Jimmy Changa","Barry Wine","Wilma Mumduya","Zack Lee","Don Stairs","Peter Pants","Hal Appeno ","Otto Matic","Tom Foolery","Al Dente","Holly Graham","Frank N. Stein","Barry Cade","Phil Anthropist ","Marvin Gardens","Phil Harmonic ","Arty Ficial","Will Power","Juan Annatoo","Curt N. Call","Max Emum","Minnie Mum","Bill Yerds","Matt Innae","Polly Science","Tara Misu","Gerry Atric","Kerry Oaky","Mary Christmas","Dan Druff","Jim Nasium","Ella Vator","Sal Vidge","Bart Ender","Artie Choke","Hans Olo","Marge Arin","Hugh Briss","Gene Poole","Ty Tanic","Lynn Guini","Claire Voyant","Marty Graw","Olive Yu","Gene Jacket","Tom Atoe","Doug Out","Beau Tie","Serj Protector","Marcus Down","Warren Peace","Bud Jet","Barney Cull","Marion Gaze","Ed Itorial","Rick Shaw","Ben Effit","Kat E. Gory","Justin Case","Aaron Ottix","Ty Ballgame","Barry Cuda","John Withawind","Joe Thyme","Mary Goround","Marge Arita","Frank Senbeans","Bill Dabear","Ray Zindaroof","Adam Zapple","Matt Schtick","Sue Shee","Chris P. Bacon","Doug Lee Duckling","Sil Antro","Cal Orie","Sara Bellum","Al Acart","Marv Ellis","Evan Shlee","Terry Bull","Mort Ission","Ken Tucky","Louis Ville","Fred Attchini","Al Fredo","Reed Iculous","Chip Zinsalsa","Matt Uhrafact","Mike Roscope","Lou Sinclark","Faye Daway","Tom Ollie","Sam Buca","Phil Anderer","Sam Owen","Mary Achi","Curtis E. Flush","Holland Oats","Eddy Kitt","Al Toesacks","Elle Bowdrop","Anna Lytics","Sara Bellum","Phil Erup","Mary Nara","Vic Tory","Bobby Pin","Juan Soponatime","Dante Sinferno","Faye Sbook","Carrie R. Pigeon","Ty Pryder","Cole Slaw","Luke Warm","Travis Tee","Clara Fication","Paul Itician","Deb Utant","Moe Thegrass","Carol Sell","Scott Schtape","Cody Pendant","Frank Furter","Barry Dalive","Mort Adella","Ray Diation","Mack Adamia","Farrah Moan","Theo Retical","Eda Torial","Tucker Doubt","Cara Larm","Abel Body","Sal Ami","Colin Derr","Mark Key","Sven Gineer","Benny Ficial","Reggie Stration","Lou Ow","Lou Tenant","Nick Knack","Patty Whack","Dan Delion","Terry Torial","Indy Nile","Ray Volver","Minnie Strone","Gustav Wind","Vinny Gret","Joyce Tick","Cliff Diver","Earl E. Riser","Cooke Edoh","Jen Youfelct","Reanne Carnation","Gio Metric","Claire Innet","Marsha Mello"];
		// Randomize the anon_names array
		for (var i = anon_names.length - 1; i > 0; i--) {
			var j = Math.floor(Math.random() * (i + 1));
			var temp = anon_names[i]; anon_names[i] = anon_names[j]; anon_names[j] = temp;
		}
		X.QSA(context,`.uiProfilePhoto,
		        .profilePic,
		        img.bfb_friend_activity_img,
		        .UIImageBlock_MED_Image img,
		        #navAccountPic img,
		        a.UIImageBlock_ENT_Image img,
		        .smallPic .img,
		        .fbChatOrderedList .pic,
		        img[src*=fbcdn-profile-],
		        .UFIActorImage,
		        img.tickerStoryImage,
                a[data-hovercard*="user.php"] img,
                a[data-hovercard*="page.php"] img`,function(i) {
			if (i.parentNode && i.parentNode.href && i.parentNode.href.indexOf("photo.php")>=0) { return; } // photo, not profile pic
			if (i.src && i.src.indexOf("external.ak.fbcdn")>=0) { return; } // External img
			if (i.parentNode && X(i.parentNode).hasClass('UIImageBlock_MED_Image')) {
				i.src="data:image/gif;base64,R0lGODlhMgAyAMQAAPP1%2Bdzh7eXp8tHY58jR4s3V5O7x9vn6%2FOru9NTa6Pz9%2Funs8%2Fb4%2BvX2%2Bv7%2B%2F%2Fb3%2Btrg7MvT5MfQ4vj5%2B9fd6t7k7uPn8MbO4czT5PHz%2BNXc6dbc6dLZ6MbP4f%2F%2F%2F8TN4CH5BAAAAAAALAAAAAAyADIAAAX%2FYCeOZGmeaKqubJt%2BcCzPdG3feK7vfF8PFcMk4ivaCIGMZ%2BkJGJ8xDYBJHUCNmAd164FcexWuGPHVLcToR%2FkmQLvV61nETffGY206unGPKfViDn0wDIBogx8HhmIdg4qLWxeDE5BbjX1alUyIU5pLiH%2BaCohnnhODBY%2BeG32lnh5wcRCvSwt9A7RNfRK5HIO5RH2znraIrwSIH6GLgskBmgbJHxeaCdIfBpCj1x%2BQVtzLdNwwnYDjiYuX15AY3LyLGtcEmvHJGpoC0nmQfMkKnsHidLCQC0FAKBgQ5KKSwZeRDeUWUjngZIcEC%2F8k0lnQzsaAbBoXNaAwgwKlkKIqA3wIAQA7";
			}
			else {
				i.src="data:image/gif;base64,R0lGODlh1ACuAPcAALjB2f%2F%2F%2F%2BPm8Njc6dTY58LJ3sDI3vL09%2B7w9dDW5dDV5cbM38PDw5KSkra%2F2LfA2LfA2bW%2F2LS%2B17W%2B17bA2LfB2f7%2B%2Fvz8%2Ff39%2FrvD2rS917W%2B2LW%2F177G3Ofp8fr6%2FLrC2tba6MTL3%2FLy99HW5sfO4b3F2%2Bbo8fv7%2FbnB2e3t7c3T5MLJ3cXM39PY57bA2b%2FG3LO81urs8%2Bzu9N3g7ODj7sHI3e%2Fw9tnd6szR4ra%2F1%2FHy9%2BLl78DH3fX2%2Btzf67vE29PX5unr8ufq8rzE28bN4PT1%2BcvR4uTn8Orr88DH3Ojq8vX2%2Bfj4%2Bvn5%2B7jB2N3h7N7h7Nzg7P79%2FtXa6Pf4%2B%2FP0%2BM3S4%2BXo8brC2fv7%2FOzt9NDV5sPK3vLz9%2F%2F%2B%2F8fN4Pb3%2BsXN4LvE2t%2Fi7bnC2ubp8fPz%2BMXL3%2BHl77O91vz7%2FeXo8Onr8%2BPm78DI3bO%2B1%2B3v9bzE2tfb6MnP4s7T5PT1%2BOLk7uHk7tLX57O91%2B7w9uvt88jO4e7v9djc6r3F3LjA2dvb29PY5s3T49%2Fj7tzg68vR48bM4KysrPDy9vPz9%2BDk7sHJ3dLX5vb2%2Btne6vf4%2Bs%2FV5dre6tre67nC2eDj7fHx9ubo8Ovt9Nvf69HX5ujr8vj5%2B%2F38%2Ff3%2B%2FszR47K81snO4fP1%2BdXa58jO4Ojq8fDx97rD2rvC2v7%2B%2F77F3M7T47zD2vr6%2B7vD2drd6rS%2B1r7G27K81bvD28nQ4b%2FH3PLy9tfc6ejq8%2F%2F%2F%2Fr%2FH3fj4%2B%2Fb2%2Bb3E29ba6dbb6Nbb6dTZ6NHV5uzt9eTm7%2F39%2Fff3%2Bu3u9O3u9b7F28bN4cfN4be%2F2PT0%2BPT0%2BfLx9%2FDy98vS4%2Fn6%2FOLk7%2Fn6%2B%2BHk7%2Fz8%2FsDI3PHz99LW5uHk7ff3%2B%2Bfq8fn4%2B8rQ4srQ4%2BPl77S%2B2MHH3u%2Fx9%2Bvs8%2BTm8OXn8PX1%2BOXn8f7%2F%2F8jP4MjP4fb4%2Bu7v9vL0%2BPv8%2FbS%2F2MzS4%2Bjp8fX3%2Bt7i7d%2Fj7fDx9s%2FU5M%2FU5cfO4Ors9PLz%2BLa%2B18LK3ubo8iH5BAAAAAAALAAAAADUAK4AAAj%2FABkEGEiwoMGDCBMqXMiwocOHECNKnEixIgOBFTNq3Mixo8ePGS%2BCHEmypMmTH0WiXMmypcuRKl%2FKnEmzJsGYNnPq3NkR50AAQIMKHUq0qNGjSJMqXcq0qdOnUKMaPegzgNSrWLNq3cq1K1KqGAt6HUu2rNmzTcEeRMu2rdu3UNUahEu3rt22csXe3cu3b9S8BP0KHkxYKOCfhRMrrnvY6uLHkM02jky5stbJljNrZop5s%2BfPhg1WBX0XAgUHDh6Qftp5NVoKESRISGFCSQ9ArtOKDhs491gHEyKoRqNA05AZO%2Bw8IqPad9LWzq9S0OMARh8qZrhd%2BGJwR4Hm0afu%2F14bHirsDRW6UMFyZqGXDhzKH4Uu%2FygECRxMlKCh6EPDNSVIUJ94BY02oFEVOCBBFnWksUhEbkxwYFH0TSgBBY388I4FE2ExAQQTDlVhfaiVIMAFGX0gjwYhhlYgb4hN6IAOIpiDAkfVHKEBiC2OGJ0Eq9iDwUcXCKMDeAf6mFsEDkhiBUkWuOGLgBMquVoEJiCB0ilFSJjkeHOVB8EEzIzAUickOEDBgFZ6BoEDBKDYkgVQALCmfG1q9oIDUnAo0wljRIAnmHr55gAIWtbkBwyChpdnZRRkMY9OlyjRqHOPRgbBA%2BnwdAMRL0SXKWQR4MDTQOcAwGNuoy7mwAJy8v9kgSMbYEpob6tRwMmpBFkBRAW%2BtZoYB4jAwytBJHjpmrCFaUDJsQRl4kCwt8b42QMgzADtQI%2FYMO2y1ToGmgM2uLJtAFNIQ%2BVqzA4WQS3nDvTHuqS1K1gE2sQbQA3fshvuag78oK8HqoL7InnjWqJvHCCsCpq9fjnggb4jZIDkZxD3JbG%2B0Fhs8E0wivvZxvE6Q8vFnmXMlwMy6GtBByhvpvJeFNCjbwAwfzyQgaBRUMXNOft7cJjjJuFy0PX%2BS5oDJ%2BiLDhAxazbzXSSfW3HUmU1tV9XbXq1zADyPPHG8XgsNMsIjY6LvIh6bvXPIAEOhbzmVOIyx0uMKHO8JBbv%2FDTbcS%2Bt9LsF2p4z3yCHoWwwAwPodtmcRcKEvDf0mPXShn0UwzOSVP3w45CvoG0Xnd1%2BOa%2BZi6BsCvZ6bbi3kqcebhxqsfq4ZBXDEfq4Ls5Aus%2B2WQfAGGZfoa0QNLYRq%2BdlEbwYBGzcT1EbfpTOPuWYQtBx9AFukUnjWwFfmgMLb8%2B044J45YOr2hdS6%2FNtoaxaP5NsHE8P58Wc2QQnbT1EH679zncg0E4ECNCF6HwCD%2B1pnvdPdThm3iJ4PeoC1ymgNLg%2BoxD6ix48yVJAyF4TLBBKlr0zo4WuP04wannUzMiiLgfBr3mYmEITozeFSMPxb%2FjLjAFAY42YEwGH1%2F2J4PT2x4Ebx%2BgIimoFC9I1MCPryQxm%2BJ7XwWcYBLWDCucLQhwW%2BT4cydFMHfAAtDIjAd4YTYG5iwANo3QACVAxgA183sjxAixEfBJ8aXeOALnziWMmy1R5X8wAgKIJXH0CDF%2FEXRs8kqI2n2kPbajfI1WjAEao4FSPgICorasYBLPjZTnRxBSEysoigeYC2dhKJDDjKk5oRxx94ggRTntKBS2PBkHRyhRdSco4DJE0FIADFnBihA3cSJDCjowEu%2BKkmUfDlL4mIS9K8AAQ7sMkaWIDGL6ZwNRJIgE1osEhqVdI3FPgHTXYAhGR28py5ccAbeiGTC9ABgOZcZnliUf8ImSCjH40rTwj9EoF8PJMlk7BlPqlJxyXlYJctoYJCpwlGVLomAg99SQgm2sQdXjSjLtkom2CZOZC2RKT1GWhfJuACmWxDmspkaDBzIwFcyIQNMF1oRavpmhikQSbkwKdOv%2BmaCYzNJaPIwhNSSlLnlYEYMjmGEtz5Tn1GpzpekEkCOepNJ%2FqmgAd8CQauINSONhKcRYiVS1wQCqbCczWByAAkaGIGE7jVqq6BAAiS8IGDvuQaN%2FBHN4e404aOTAQ8IUE5b2nY9LGCJ4YYbBrxupoJrE8nHqCqWS3qGQnkgie8SMEr3%2BrIDByAJxfoQhwnK9OvFsE%2FO1HHMMrK2sL%2FztQzGiAFr7AQn5jaNjeq0R5PmNADyeqRsp%2FRgAggypMgxCCgjL0tpAQkijhAKxKSyMAEjBsZlaLlPmNYwRaYeywvuKADF%2BqqRxeToAkQwQV72F4A7ACJcXAgAqtdjHfHsl0bwIKM8iWIN%2B7QggrQVjH73coDNuCAUuDBCQFGyBS6QYgnpNeCTaWaBDKwgjZoIcILsUA0BgGICfQWMgmOyps0YIM5mAnEDwmDIdBw3%2FzuJcVOocAEnqCPGoQBxhNxwhKOAILtIjjDbHmABORAgmICOSM3AAY2JqBZvuAYKQ%2BgMgugkI0ne4QJ1ABDlrnLlisX5QEaeMUhMKFWL3cE%2FwNb2IQsNFBluJg5KA%2BIgA5ggAMEuBklVqjHGal8lzvfJwUl4AGE%2F8wSFJhiBa24sJ2RfJUESYAIQeCDXxnNkhsMwBYScICNuZJiDjjAAJN4Eqdt0o4aiOA%2B0JUMpZ0CgSO14A7TWDVPPHGCbwDgQ2hR6QQeUIIhwFbXp7rADFbw61H%2FZdZK0TE7TrBpZJ%2BKD%2FgIBJlZA%2B2jZHkX1viwtV2WhBYQ2itTc0AKhCHKcUfvAlGQw2KvMjMJ9GAJ7gbxPdYB7K2obAKHAHC%2BI3yBEIja390WigRI0OaBB1gKEYj1s0nLlIWT1%2BERlgIF8vichP%2BaDkjE%2BJNXl5V2UaADz%2FsQuZtRsIwTTxy5THEAJFXuZXc0jN7djkARLk7zCH9hEAf%2BSs6H0PM%2Fn2EMziaKsB7QCHEX3cuE2LaIoK2Byz79yWYIOoFgjuUUCPfqQDaCCerccYobxQGNCCvYYayCAFzgCFqfutmLMgFwrP3JbQ8ADljE7bkTxQG%2FuDuQ8x6OB0i87Fw%2FigPwIHi2DyQZqEg6UFr1AHw3PsJ5P4MJOO4iYF7%2B8xCpCuhHzxDRk%2F70jUG96j2%2FetWbvvWnZ0AiGkD72tv%2B9rjPve53z%2Fve%2B%2F73wA%2B%2B8IdP%2FOIbPxGCuIjyl8%2F85jv%2F%2BdCPvvSnT%2F3qW%2F%2F62M%2B%2B9rfPAEEEBAA7";
			}
		});
		X.QSA(context,'#navAccountName,#navTimeline a',function(o) {
			if (X(o,'img')){return;}
			var c=o.innerHTML;
			if (o.href) { 
				if (o.href.indexOf("?")>-1) {
					if (/profile.php/.test(o.href)) {
						c = o.href.replace(/(profile.php[^\&]+).*/,"$1");
					}
					else {
						c = o.href.substring(0,o.href.indexOf("?")); 
					}
				}
				else {
					c=o.href;
				}
			}
			if (!namehash[c]) { colorhash[c]=colorcount++; if(colorcount>24) { colorcount=1; } namehash[c] = "Me"; }
			X(o).text(namehash[c]).addClass('sfx_anonymous sfx_anonymous_'+colorhash[c]);
		});
		X.QSA(context,'.UFIReplySocialSentenceLinkText,.actorName a,a.actorName,a.ego_title,span.blueName,a.passiveName,.fbxWelcomeBoxName,*[data-hovercard*="user"],*[data-hovercard*="page"],*[data-hovercard*="group"],a[href*="/profile.php"],.headerTinymanName,.UFICommentActorName,.UFILikeSentence a[href^="http"],#navTimeline a,.tickerFeedMessage .passiveName, a.profileLink, #friends_reminders_link .fbRemindersTitle strong',function(o) {
			if (X(o).find('img').length>0 || X(o).hasClass('sfx_anonymous')){return;}
			var c=o.innerHTML;
			if (o.href) { 
				if (o.href.indexOf("?")>-1) {
					if (/profile.php/.test(o.href)) {
						c = o.href.replace(/(profile.php[^\&]+).*/,"$1");
					}
					else {
						c = o.href.substring(0,o.href.indexOf("?")); 
					}
				}
				else {
					c=o.href;
				}
			}
			if (!namehash[c]) { colorhash[c]=colorcount++; if(colorcount>24) { colorcount=1; } namehash[c] = anon_names[namecount++ % anon_names.length]; }
			X(o).text(namehash[c]).addClass('sfx_anonymous sfx_anonymous_'+colorhash[c]);
		});
		// Friend names in Like sentence
		X.QSA(context,'a[href^="/ufi/reaction"] span[data-hover]', function(o) {
			X(o).safe_html( o.innerHTML.replace(/.*? and (\d+.*)$/,"$1") );
		});
		X.QSA(context,'#groupSideNav .linkWrap',function(o) {
			var c = o.innerHTML;
			if (!grouphash[c]) { grouphash[c] = "Group #"+(groupcount++); }
			X(o).text(grouphash[c]);
		});
		// Try to anonymize names in the ticker that are not friends
		X.QSA(context,'.tickerFeedMessage .fwb',function(token) {
			try {
				if (token.nextSibling.nodeType==3) {
					token.textContent = "another user";
				}
			}
			catch (e) { }
		});
		X.QSA(context,'.tickerFeedMessage',function(msg) {
			try {
				if (/ (on|likes) [^']+'s /.test(msg.innerHTML)) {
					msg.innerHTML = msg.innerHTML.replace(/ (on|likes) [^']+'s /,' $1 someone\'s ');
				}
			}
			catch (e) { }
		});
        X.QSA(context,'.tickerFeedMessage',function(msg) {
            try {
                if (/posted in/.test(msg.innerHTML)) {
                    msg.innerHTML = msg.innerHTML.replace(/posted in [^\.]+/,'posted');
                }
            }
            catch (e) { }
        });
		// Anonymize Friend lists
		X.QSA(context,'#listsNav .linkWrap, #pinnedNav li[data-type="type_friend_list"] .linkWrap',function(o) { X(o).text('Friend List'); });
		// Anonymize Pages
		X.QSA(context,'#pagesNav .linkWrap, #pinnedNav li[data-type="type_page"] .linkWrap',function(o) { X(o).text('Page'); });
		// Anonymize Groups
		X.QSA(context,'#groupsNav .linkWrap, #pinnedNav li[data-type="type_group"] .linkWrap',function(o) { X(o).text('Group'); });
		// Events
		X.QSA(context,'#pagelet_reminders #event_reminders_link .fbRemindersTitle, #eventsNav .linkWrap',function(o) { X(o).text('Event'); });
	};
});
