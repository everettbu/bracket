class MarchMadnessBracket {
    constructor() {
        this.teams = [];
        this.bracket = {};
        this.currentRound = 1;
        this.maxRounds = 6;
        this.regionNames = ["Region 1", "Region 2", "Region 3", "Region 4"];
        this.maintainRegionalBoundaries = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeBracket();
    }

    setupEventListeners() {
        document.getElementById('reset-bracket').addEventListener('click', () => {
            this.resetBracket();
        });

        document.getElementById('randomize-teams').addEventListener('click', () => {
            this.randomizeTeams();
        });

        // Bracket selector buttons
        document.querySelectorAll('.bracket-option').forEach(button => {
            button.addEventListener('click', (e) => {
                const bracketType = e.target.dataset.bracket;
                this.selectBracket(bracketType);
            });
        });

        document.getElementById('load-custom-songs').addEventListener('click', () => {
            this.loadCustomSongs();
        });

        document.getElementById('cancel-custom-input').addEventListener('click', () => {
            this.hideCustomInput();
            // Remove active state from custom button
            document.querySelectorAll('.bracket-option').forEach(btn => {
                btn.classList.remove('active');
            });
        });
    }

    selectBracket(bracketType) {
        // Update active button state
        document.querySelectorAll('.bracket-option').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-bracket="${bracketType}"]`).classList.add('active');

        if (bracketType === 'custom') {
            this.toggleCustomInput();
        } else {
            this.hideCustomInput();
            this.loadSampleTeams(bracketType);
            this.updateTitle(bracketType);
        }
    }

    updateTitle(bracketType) {
        const titles = {
            food: 'Food Bracket',
            rappers: 'Rapper Bracket',
            stags: 'Stags Bracket',
            custom: 'Custom Bracket'
        };
        const titleEl = document.getElementById('bracket-title');
        if (titleEl) {
            titleEl.textContent = titles[bracketType] || 'Tournament Bracket';
        }
    }

    initializeBracket() {
        // Initialize bracket structure for 6 rounds
        for (let round = 1; round <= this.maxRounds; round++) {
            this.bracket[round] = [];
        }
        this.renderBracket();
    }

    setTeams(teams) {
        if (teams.length !== 64) {
            throw new Error('Exactly 64 teams required for March Madness bracket');
        }
        
        this.teams = teams;
        this.resetBracket();
        this.populateFirstRound();
        this.renderBracket();
    }

    setTeamsByRegions(region1, region2, region3, region4, regionNames = null) {
        if (region1.length !== 16 || region2.length !== 16 || region3.length !== 16 || region4.length !== 16) {
            throw new Error('Each region must contain exactly 16 teams');
        }
        
        if (regionNames) {
            this.setRegionNames(regionNames);
        }
        
        const teams = [...region1, ...region2, ...region3, ...region4];
        this.setTeams(teams);
    }

    setTeamsFromSingleList(teamsList, randomize = true) {
        if (teamsList.length !== 64) {
            throw new Error('Exactly 64 teams required');
        }
        
        let teams = [...teamsList];
        
        if (randomize) {
            // Shuffle entire list
            teams = this.shuffleArray(teams);
        }
        
        this.setTeams(teams);
    }

    setRegionNames(names) {
        if (names.length !== 4) {
            throw new Error('Exactly 4 region names required');
        }
        this.regionNames = names;
        this.updateRegionNamesInUI();
    }

    updateRegionNamesInUI() {
        const quadrants = [
            document.querySelector('#quadrant-1 h2'),
            document.querySelector('#quadrant-2 h2'),
            document.querySelector('#quadrant-3 h2'),
            document.querySelector('#quadrant-4 h2')
        ];
        
        quadrants.forEach((quadrant, index) => {
            if (quadrant) {
                quadrant.textContent = this.regionNames[index];
            }
        });
    }

    populateFirstRound() {
        // Initialize bracket structure for quadrants
        this.bracket = {
            quadrants: {
                1: { rounds: {} },
                2: { rounds: {} },
                3: { rounds: {} },
                4: { rounds: {} }
            },
            finalFour: [],
            championship: null,
            winner: null
        };

        // Populate each quadrant with 16 teams (4 rounds each)
        for (let quadrant = 1; quadrant <= 4; quadrant++) {
            const startIndex = (quadrant - 1) * 16;
            const quadrantTeams = this.teams.slice(startIndex, startIndex + 16);
            
            // Round 1: 16 teams -> 8 matches
            this.bracket.quadrants[quadrant].rounds[1] = [];
            for (let i = 0; i < 16; i += 2) {
                this.bracket.quadrants[quadrant].rounds[1].push({
                    team1: quadrantTeams[i],
                    team2: quadrantTeams[i + 1],
                    winner: null,
                    matchId: `q${quadrant}-r1-m${Math.floor(i / 2)}`
                });
            }

            // Initialize empty rounds for quadrant
            for (let round = 2; round <= 4; round++) {
                const numMatches = Math.pow(2, 4 - round);
                this.bracket.quadrants[quadrant].rounds[round] = [];
                for (let i = 0; i < numMatches; i++) {
                    this.bracket.quadrants[quadrant].rounds[round].push({
                        team1: null,
                        team2: null,
                        winner: null,
                        matchId: `q${quadrant}-r${round}-m${i}`
                    });
                }
            }
        }

        // Initialize Final Four and Championship
        this.bracket.finalFour = [
            { team1: null, team2: null, winner: null, matchId: 'f4-m1' },
            { team1: null, team2: null, winner: null, matchId: 'f4-m2' }
        ];

        this.bracket.championship = {
            team1: null,
            team2: null,
            winner: null,
            matchId: 'championship'
        };
    }

    renderBracket() {
        // Render each quadrant
        for (let quadrant = 1; quadrant <= 4; quadrant++) {
            this.renderQuadrant(quadrant);
        }
        
        // Render Final Four and Championship
        this.renderFinalFour();
        this.renderChampionship();
        this.renderChampion();
    }

    renderQuadrant(quadrant) {
        for (let round = 1; round <= 4; round++) {
            const container = document.getElementById(`round-${round}-q${quadrant}-matches`);
            if (!container) continue;

            container.innerHTML = '';
            
            this.bracket.quadrants[quadrant].rounds[round].forEach((match, index) => {
                const matchDiv = document.createElement('div');
                matchDiv.className = 'match';
                matchDiv.setAttribute('data-quadrant', quadrant);
                matchDiv.setAttribute('data-round', round);
                matchDiv.setAttribute('data-match', index);

                const team1Div = this.createTeamElement(match.team1, match.winner === match.team1, `q${quadrant}`, round, index, 0);
                const team2Div = this.createTeamElement(match.team2, match.winner === match.team2, `q${quadrant}`, round, index, 1);

                matchDiv.appendChild(team1Div);
                matchDiv.appendChild(team2Div);
                container.appendChild(matchDiv);
            });
        }
    }

    renderFinalFour() {
        const container = document.getElementById('round-5-matches');
        if (!container) return;

        container.innerHTML = '';
        
        this.bracket.finalFour.forEach((match, index) => {
            const matchDiv = document.createElement('div');
            matchDiv.className = 'match';
            matchDiv.setAttribute('data-round', 5);
            matchDiv.setAttribute('data-match', index);

            const team1Div = this.createTeamElement(match.team1, match.winner === match.team1, 'f4', 5, index, 0);
            const team2Div = this.createTeamElement(match.team2, match.winner === match.team2, 'f4', 5, index, 1);

            matchDiv.appendChild(team1Div);
            matchDiv.appendChild(team2Div);
            container.appendChild(matchDiv);
        });
    }

    renderChampionship() {
        const container = document.getElementById('round-6-matches');
        if (!container) return;

        container.innerHTML = '';
        
        const match = this.bracket.championship;
        const matchDiv = document.createElement('div');
        matchDiv.className = 'match';
        matchDiv.setAttribute('data-round', 6);
        matchDiv.setAttribute('data-match', 0);

        const team1Div = this.createTeamElement(match.team1, match.winner === match.team1, 'champ', 6, 0, 0);
        const team2Div = this.createTeamElement(match.team2, match.winner === match.team2, 'champ', 6, 0, 1);

        matchDiv.appendChild(team1Div);
        matchDiv.appendChild(team2Div);
        container.appendChild(matchDiv);
    }

    createTeamElement(teamName, isWinner, section, round, matchIndex, teamIndex) {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team';
        
        if (!teamName) {
            teamDiv.className += ' empty';
            teamDiv.textContent = 'TBD';
        } else {
            teamDiv.textContent = teamName;
            
            if (isWinner) {
                teamDiv.className += ' winner';
            } else {
                // Check if match has a winner and this isn't it
                let match;
                if (section.startsWith('q')) {
                    const quadrant = parseInt(section.slice(1));
                    match = this.bracket.quadrants[quadrant].rounds[round][matchIndex];
                } else if (section === 'f4') {
                    match = this.bracket.finalFour[matchIndex];
                } else if (section === 'champ') {
                    match = this.bracket.championship;
                }
                
                if (match && match.winner && match.winner !== teamName) {
                    teamDiv.className += ' loser';
                }
            }

            teamDiv.addEventListener('click', () => {
                this.selectWinner(section, round, matchIndex, teamName, teamIndex);
            });
        }

        return teamDiv;
    }

    selectWinner(section, round, matchIndex, teamName, teamIndex) {
        if (!teamName || teamName === 'TBD') return;
        
        let match;
        
        // Get the match based on section
        if (section.startsWith('q')) {
            const quadrant = parseInt(section.slice(1));
            match = this.bracket.quadrants[quadrant].rounds[round][matchIndex];
        } else if (section === 'f4') {
            match = this.bracket.finalFour[matchIndex];
        } else if (section === 'champ') {
            match = this.bracket.championship;
        }
        
        if (!match) return;
        
        // Set winner
        match.winner = teamName;
        
        // Advance winner
        this.advanceWinner(section, round, matchIndex, teamName);
        
        // Re-render affected sections
        if (section.startsWith('q')) {
            const quadrant = parseInt(section.slice(1));
            this.renderQuadrant(quadrant);
            if (round === 4) {
                this.renderFinalFour();
            }
        } else if (section === 'f4') {
            this.renderFinalFour();
            this.renderChampionship();
        } else if (section === 'champ') {
            this.renderChampionship();
        }
        
        this.renderChampion();
    }

    advanceWinner(section, round, matchIndex, winner) {
        if (section.startsWith('q')) {
            const quadrant = parseInt(section.slice(1));
            
            if (round < 4) {
                // Advance within quadrant
                const nextRound = round + 1;
                const nextMatchIndex = Math.floor(matchIndex / 2);
                const teamPosition = matchIndex % 2;
                
                const nextMatch = this.bracket.quadrants[quadrant].rounds[nextRound][nextMatchIndex];
                if (teamPosition === 0) {
                    nextMatch.team1 = winner;
                } else {
                    nextMatch.team2 = winner;
                }
            } else if (round === 4) {
                // Advance to Final Four
                const finalFourIndex = quadrant <= 2 ? 0 : 1;
                const teamPosition = (quadrant - 1) % 2;
                
                if (teamPosition === 0) {
                    this.bracket.finalFour[finalFourIndex].team1 = winner;
                } else {
                    this.bracket.finalFour[finalFourIndex].team2 = winner;
                }
            }
        } else if (section === 'f4') {
            // Advance to Championship
            const teamPosition = matchIndex;
            if (teamPosition === 0) {
                this.bracket.championship.team1 = winner;
            } else {
                this.bracket.championship.team2 = winner;
            }
        } else if (section === 'champ') {
            // Set overall winner
            this.bracket.winner = winner;
        }
    }

    animateAdvancement(round) {
        const container = document.getElementById(`round-${round}-matches`);
        if (container) {
            const newTeams = container.querySelectorAll('.team:not(.empty)');
            newTeams.forEach(team => {
                team.classList.add('new-winner');
                setTimeout(() => {
                    team.classList.remove('new-winner');
                }, 500);
            });
        }
    }

    renderChampion() {
        const championDiv = document.getElementById('champion');
        if (!championDiv) return;

        const champion = this.bracket.winner;
        
        const teamSlot = championDiv.querySelector('.team-slot');
        teamSlot.textContent = champion || 'TBD';
        
        if (champion) {
            championDiv.classList.add('has-champion');
        } else {
            championDiv.classList.remove('has-champion');
        }
    }

    resetBracket() {
        // Repopulate bracket if teams are set
        if (this.teams.length === 64) {
            this.populateFirstRound();
        } else {
            // Clear bracket structure
            this.bracket = {
                quadrants: { 1: { rounds: {} }, 2: { rounds: {} }, 3: { rounds: {} }, 4: { rounds: {} } },
                finalFour: [],
                championship: null,
                winner: null
            };
        }
        
        this.renderBracket();
    }

    loadSampleTeams(datasetName = 'food') {
        let teams = [];
        
        switch(datasetName) {
            case 'rappers':
                const region1 = [
                    "Tupac", "Kendrick Lamar", "Dr. Dre", "Snoop Dogg", "Ice Cube", "E-40", "The Game", "Tyler, the Creator", "Vince Staples", "Schoolboy Q", "Nate Dogg", "Anderson .Paak", "Drake", "Childish Gambino", "Trippie Redd", "YG"
                ];
                
                const region2 = [
                    "Jay-Z", "Nas", "Biggie", "DMX", "50 Cent", "Eminem", "Pop Smoke", "MF DOOM", "A$AP Rocky", "Joey Bada$$", "Nicki Minaj", "Action Bronson", "Meek Mill", "A$AP Ferg", "Kid Cudi", "Lil Uzi Vert"
                ];
                
                const region3 = [
                  "Future", "Young Thug", "Lil Baby", "21 Savage", "Gunna", "Jeezy", "T.I.", "Gucci Mane", "Andre 3000", "Playboi Carti", "Waka Flocka", "Lil Yachty", "Kodak Black", "2 Chainz", "Big Sean", "Rich Homie Quan"
                ];
                
                const region4 = [
                   "Kanye West", "Chief Keef", "Juice WRLD", "Pusha T", "Mike Jones", "J. Cole", "Lil Wayne", "NBA YoungBoy", "Kevin Gates", "Don Toliver", "Mac Miller", "Juicy J", "Twista", "Travis Scott", "Denzel Curry", "Rick Ross"
                ];
                
                teams = [...region1, ...region2, ...region3, ...region4];
                this.setRegionNames(["California", "Northeast", "Atl + Detroit", "South + Chiraq"]);
                this.maintainRegionalBoundaries = true;
                break;
                
            case 'stags':
                // Example NBA teams dataset
                teams = [
                    "Cooper Nixon", "Samuel Brewer", "Robert Litscher", "Nick Wilde", "Justin Edwards", "Tarius Hamlin", "Jake Prieto", "Evan Siegel", "Andrew Kress", "Lorance Wong", "Owen Benjamin", "Roman Ramirez", "Zach Fogel", "Anthony Carrano", "Walter Kuhlenkamp", "Brandon Becker", "CJ Jackson", "James Catron", "Bryce DesJardins", "Daniel Kroshchuk", "Calvin Miller", "Luke Carfaro", "Bryce Mey", "Caleb Carfaro", "Grayson Therron", "Patrick Wilson", "Gabe Alencar", "Michael Houk", "Dylan Phares", "Zachariah Schlichting", "Austin Andersen", "Rich Brutto", "Luke Gildred", "Anderson Cynkar", "Kevin White", "Chase Cioe", "Ethan Hemby", "Brendan Cannon", "Cesar Fernandez", "James Raymond", "Quintin Craig", "Dylan Cotti", "Jason Malley", "Evan Gerber", "Stiles Satterlee", "Kaden Gallant", "Luke Ferris", "Wyatt Chang", "Mason Cotton", "Daniel Rosenberg", "Aidan Cushing", "Peter Boehm", "Connor Cryan", "Kirby Baynes", "Thanio Bright", "Jacob Fenton", "Jacob O'Connell", "Andrew Carrasquillo", "Ben Kim", "Benjamin Littlefield", "Tom Burton", "Michael Colangelo", "Ben Cooney", "Chris Amemiya"
                ];
                this.setRegionNames(["Fat", "Stinky", "Gay", "Cookie Monster"]);
                this.maintainRegionalBoundaries = false;
                break;
                
            case 'food':
                const foodRegion1 = [
                    "Burger", "Pizza", "Fried chicken", "Steak", "BBQ ribs", "BBQ brisket", "Pulled pork", "Mac & cheese",
                    "Hot dog", "Corn dog", "Buffalo wings", "Grilled cheese", "Chili", "Lobster roll", "Clam chowder", "Chicken Caesar salad"
                ];

                const foodRegion2 = [
                    "Taco", "Burrito", "Quesadilla", "Enchiladas", "Tamales", "Fajitas", "Nachos", "Street corn (elote)",
                    "Guacamole", "Taquitos", "Empanadas", "Pupusas", "Chilaquiles", "Ceviche", "Tostadas", "Paella"
                ];

                const foodRegion3 = [
                    "Sushi", "Ramen", "Pho", "Pad Thai", "Fried rice", "Dumplings", "Bibimbap", "Katsu",
                    "Butter chicken", "Curry", "Banh mi", "Pad see ew", "Peking duck", "Bao buns", "Bulgogi", "Teriyaki chicken"
                ];

                const foodRegion4 = [
                    "Carbonara", "Bolognese", "Lasagna", "Risotto", "Gnocchi", "Panini", "Croque monsieur", "Shepherd's pie",
                    "Gyro", "Falafel", "Hummus & pita", "Kebab", "Schnitzel", "Bratwurst", "Fish & chips", "Croissant"
                ];

                teams = [...foodRegion1, ...foodRegion2, ...foodRegion3, ...foodRegion4];
                this.setRegionNames(["American", "Latin American", "Asian", "European"]);
                this.maintainRegionalBoundaries = true;
                break;
                
            default:
                // Allow custom array to be passed
                if (Array.isArray(datasetName) && datasetName.length === 64) {
                    teams = datasetName;
                } else {
                    console.error('Invalid dataset name or array. Using default rappers dataset.');
                    return this.loadSampleTeams('rappers');
                }
        }
        
        this.setTeams(teams);
    }

    randomizeTeams() {
        if (this.teams.length === 0) {
            alert('No teams loaded. Please load teams first.');
            return;
        }

        if (this.maintainRegionalBoundaries) {
            // Split teams into 4 regions of 16 teams each
            const region1 = this.teams.slice(0, 16);
            const region2 = this.teams.slice(16, 32);
            const region3 = this.teams.slice(32, 48);
            const region4 = this.teams.slice(48, 64);

            // Shuffle each region separately
            const shuffledRegion1 = this.shuffleArray([...region1]);
            const shuffledRegion2 = this.shuffleArray([...region2]);
            const shuffledRegion3 = this.shuffleArray([...region3]);
            const shuffledRegion4 = this.shuffleArray([...region4]);

            // Combine shuffled regions back together
            const shuffledTeams = [...shuffledRegion1, ...shuffledRegion2, ...shuffledRegion3, ...shuffledRegion4];
            this.setTeams(shuffledTeams);
        } else {
            // Shuffle all 64 teams together
            const allTeams = [...this.teams];
            const shuffledTeams = this.shuffleArray(allTeams);
            
            // Set the fully randomized teams
            this.setTeams(shuffledTeams);
        }
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    toggleCustomInput() {
        const container = document.getElementById('custom-input-container');
        container.style.display = container.style.display === 'none' ? 'block' : 'none';
    }

    hideCustomInput() {
        document.getElementById('custom-input-container').style.display = 'none';
    }

    loadCustomSongs() {
        const regions = [];
        
        for (let i = 1; i <= 4; i++) {
            const textarea = document.getElementById(`region-${i}-input`);
            const songs = textarea.value.trim().split('\n').filter(song => song.trim() !== '');
            
            if (songs.length !== 16) {
                alert(`Region ${i} must have exactly 16 songs. Currently has ${songs.length}.`);
                return;
            }
            
            regions.push(...songs);
        }
        
        if (regions.length !== 64) {
            alert(`Total songs must be 64. Currently have ${regions.length}.`);
            return;
        }
        
        try {
            this.setTeams(regions);
            this.hideCustomInput();
            this.updateTitle('custom');

            // Clear the text areas
            for (let i = 1; i <= 4; i++) {
                document.getElementById(`region-${i}-input`).value = '';
            }

            alert('Custom bracket loaded successfully!');
        } catch (error) {
            alert('Error loading custom bracket: ' + error.message);
        }
    }

    exportBracket() {
        return JSON.stringify(this.bracket, null, 2);
    }

    importBracket(bracketData) {
        try {
            this.bracket = JSON.parse(bracketData);
            this.renderBracket();
        } catch (error) {
            console.error('Error importing bracket:', error);
        }
    }
}

// Initialize the bracket when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.bracket = new MarchMadnessBracket();

    // Global function to set teams (to be called when user provides teams)
    window.setTeams = function(teams) {
        try {
            window.bracket.setTeams(teams);
            console.log('Teams loaded successfully!');
        } catch (error) {
            console.error('Error setting teams:', error.message);
            alert('Error: ' + error.message);
        }
    };

    // Global function to set teams by regions
    window.setTeamsByRegions = function(region1, region2, region3, region4, regionNames = null) {
        try {
            window.bracket.setTeamsByRegions(region1, region2, region3, region4, regionNames);
            console.log('Teams loaded successfully by regions!');
        } catch (error) {
            console.error('Error setting teams by regions:', error.message);
            alert('Error: ' + error.message);
        }
    };

    // Global function to set teams from a single list
    window.setTeamsFromSingleList = function(teamsList, randomize = true) {
        try {
            window.bracket.setTeamsFromSingleList(teamsList, randomize);
            console.log('Teams loaded successfully from single list!');
        } catch (error) {
            console.error('Error setting teams from list:', error.message);
            alert('Error: ' + error.message);
        }
    };

    // Global function to load sample teams with different datasets
    window.loadSampleTeams = function(datasetName = 'food') {
        try {
            window.bracket.loadSampleTeams(datasetName);
            window.bracket.updateTitle(datasetName);
            console.log(`Sample teams loaded successfully: ${datasetName}`);
        } catch (error) {
            console.error('Error loading sample teams:', error.message);
            alert('Error: ' + error.message);
        }
    };
});

// Helper function to validate team list
function validateTeams(teams) {
    if (!Array.isArray(teams)) {
        throw new Error('Teams must be provided as an array');
    }
    
    if (teams.length !== 64) {
        throw new Error(`Expected 64 teams, got ${teams.length}`);
    }
    
    // Check for duplicates
    const uniqueTeams = new Set(teams);
    if (uniqueTeams.size !== teams.length) {
        throw new Error('Duplicate teams found in the list');
    }
    
    return true;
}