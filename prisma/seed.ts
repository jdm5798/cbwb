import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seeds canonical NCAAB team records with ESPN IDs and known aliases.
 * Run with: npm run db:seed
 *
 * ESPN IDs are the numeric team IDs used in the ESPN unofficial API.
 * You can find them by inspecting ESPN scoreboard JSON responses.
 */
const TEAMS = [
  // ACC
  { canonicalName: "Duke", espnId: "150", aliases: ["Duke", "Blue Devils"], conference: "ACC" },
  { canonicalName: "North Carolina", espnId: "153", aliases: ["North Carolina", "UNC", "Tar Heels", "N. Carolina"], conference: "ACC" },
  { canonicalName: "Virginia", espnId: "258", aliases: ["Virginia", "UVA", "Cavaliers"], conference: "ACC" },
  { canonicalName: "Louisville", espnId: "97", aliases: ["Louisville", "Cards", "Cardinals"], conference: "ACC" },
  { canonicalName: "Syracuse", espnId: "183", aliases: ["Syracuse", "Orange", "Cuse"], conference: "ACC" },
  { canonicalName: "Notre Dame", espnId: "87", aliases: ["Notre Dame", "Fighting Irish", "ND"], conference: "ACC" },
  { canonicalName: "Florida State", espnId: "52", aliases: ["Florida State", "FSU", "Seminoles"], conference: "ACC" },
  { canonicalName: "Miami", espnId: "235", aliases: ["Miami", "Miami FL", "Hurricanes"], conference: "ACC" },
  { canonicalName: "Clemson", espnId: "228", aliases: ["Clemson", "Tigers"], conference: "ACC" },
  { canonicalName: "Wake Forest", espnId: "154", aliases: ["Wake Forest", "Demon Deacons"], conference: "ACC" },
  { canonicalName: "Pittsburgh", espnId: "221", aliases: ["Pittsburgh", "Pitt", "Panthers"], conference: "ACC" },
  { canonicalName: "Virginia Tech", espnId: "259", aliases: ["Virginia Tech", "VT", "Hokies"], conference: "ACC" },
  { canonicalName: "NC State", espnId: "152", aliases: ["NC State", "North Carolina State", "Wolfpack"], conference: "ACC" },
  { canonicalName: "Georgia Tech", espnId: "59", aliases: ["Georgia Tech", "Yellow Jackets", "GT"], conference: "ACC" },
  { canonicalName: "Boston College", espnId: "103", aliases: ["Boston College", "BC", "Eagles"], conference: "ACC" },
  { canonicalName: "California", espnId: "25", aliases: ["California", "Cal", "Golden Bears"], conference: "ACC" },
  { canonicalName: "Stanford", espnId: "24", aliases: ["Stanford", "Cardinal"], conference: "ACC" },

  // Big Ten
  { canonicalName: "Michigan State", espnId: "127", aliases: ["Michigan State", "MSU", "Spartans"], conference: "Big Ten" },
  { canonicalName: "Indiana", espnId: "84", aliases: ["Indiana", "Hoosiers", "IU"], conference: "Big Ten" },
  { canonicalName: "Purdue", espnId: "202", aliases: ["Purdue", "Boilermakers"], conference: "Big Ten" },
  { canonicalName: "Michigan", espnId: "130", aliases: ["Michigan", "Wolverines"], conference: "Big Ten" },
  { canonicalName: "Ohio State", espnId: "194", aliases: ["Ohio State", "OSU", "Buckeyes"], conference: "Big Ten" },
  { canonicalName: "Illinois", espnId: "356", aliases: ["Illinois", "Fighting Illini", "Illini"], conference: "Big Ten" },
  { canonicalName: "Wisconsin", espnId: "275", aliases: ["Wisconsin", "Badgers"], conference: "Big Ten" },
  { canonicalName: "Iowa", espnId: "2294", aliases: ["Iowa", "Hawkeyes"], conference: "Big Ten" },
  { canonicalName: "Nebraska", espnId: "158", aliases: ["Nebraska", "Cornhuskers", "Huskers"], conference: "Big Ten" },
  { canonicalName: "Minnesota", espnId: "135", aliases: ["Minnesota", "Gophers", "Golden Gophers"], conference: "Big Ten" },
  { canonicalName: "Penn State", espnId: "213", aliases: ["Penn State", "Nittany Lions", "PSU"], conference: "Big Ten" },
  { canonicalName: "Northwestern", espnId: "77", aliases: ["Northwestern", "Wildcats"], conference: "Big Ten" },
  { canonicalName: "Maryland", espnId: "120", aliases: ["Maryland", "Terrapins", "Terps"], conference: "Big Ten" },
  { canonicalName: "Rutgers", espnId: "164", aliases: ["Rutgers", "Scarlet Knights"], conference: "Big Ten" },
  { canonicalName: "UCLA", espnId: "26", aliases: ["UCLA", "Bruins"], conference: "Big Ten" },
  { canonicalName: "USC", espnId: "30", aliases: ["USC", "Trojans", "Southern California"], conference: "Big Ten" },
  { canonicalName: "Oregon", espnId: "2483", aliases: ["Oregon", "Ducks"], conference: "Big Ten" },
  { canonicalName: "Washington", espnId: "264", aliases: ["Washington", "Huskies"], conference: "Big Ten" },

  // SEC
  { canonicalName: "Kentucky", espnId: "96", aliases: ["Kentucky", "Wildcats", "UK"], conference: "SEC" },
  { canonicalName: "Tennessee", espnId: "2633", aliases: ["Tennessee", "Volunteers", "Vols"], conference: "SEC" },
  { canonicalName: "Alabama", espnId: "333", aliases: ["Alabama", "Crimson Tide", "Bama"], conference: "SEC" },
  { canonicalName: "Auburn", espnId: "2", aliases: ["Auburn", "Tigers"], conference: "SEC" },
  { canonicalName: "Florida", espnId: "57", aliases: ["Florida", "Gators", "UF"], conference: "SEC" },
  { canonicalName: "Arkansas", espnId: "8", aliases: ["Arkansas", "Razorbacks", "Hogs"], conference: "SEC" },
  { canonicalName: "LSU", espnId: "99", aliases: ["LSU", "Tigers", "Louisiana State"], conference: "SEC" },
  { canonicalName: "Mississippi State", espnId: "344", aliases: ["Mississippi State", "MSU", "Bulldogs"], conference: "SEC" },
  { canonicalName: "Ole Miss", espnId: "145", aliases: ["Ole Miss", "Mississippi", "Rebels"], conference: "SEC" },
  { canonicalName: "Georgia", espnId: "61", aliases: ["Georgia", "Bulldogs", "UGA"], conference: "SEC" },
  { canonicalName: "Missouri", espnId: "142", aliases: ["Missouri", "Mizzou", "Tigers"], conference: "SEC" },
  { canonicalName: "Vanderbilt", espnId: "238", aliases: ["Vanderbilt", "Commodores", "Vandy"], conference: "SEC" },
  { canonicalName: "South Carolina", espnId: "2579", aliases: ["South Carolina", "Gamecocks"], conference: "SEC" },
  { canonicalName: "Texas A&M", espnId: "245", aliases: ["Texas A&M", "Aggies", "TAMU"], conference: "SEC" },
  { canonicalName: "Texas", espnId: "251", aliases: ["Texas", "Longhorns", "UT"], conference: "SEC" },
  { canonicalName: "Oklahoma", espnId: "201", aliases: ["Oklahoma", "Sooners", "OU"], conference: "SEC" },

  // Big 12
  { canonicalName: "Kansas", espnId: "2305", aliases: ["Kansas", "Jayhawks", "KU"], conference: "Big 12" },
  { canonicalName: "Baylor", espnId: "239", aliases: ["Baylor", "Bears"], conference: "Big 12" },
  { canonicalName: "Houston", espnId: "248", aliases: ["Houston", "Cougars", "UH"], conference: "Big 12" },
  { canonicalName: "Iowa State", espnId: "66", aliases: ["Iowa State", "Cyclones", "ISU"], conference: "Big 12" },
  { canonicalName: "TCU", espnId: "2628", aliases: ["TCU", "Horned Frogs", "Texas Christian"], conference: "Big 12" },
  { canonicalName: "Kansas State", espnId: "2306", aliases: ["Kansas State", "K-State", "Wildcats", "KSU"], conference: "Big 12" },
  { canonicalName: "West Virginia", espnId: "277", aliases: ["West Virginia", "Mountaineers", "WVU"], conference: "Big 12" },
  { canonicalName: "Oklahoma State", espnId: "197", aliases: ["Oklahoma State", "Cowboys", "OSU"], conference: "Big 12" },
  { canonicalName: "BYU", espnId: "252", aliases: ["BYU", "Brigham Young", "Cougars"], conference: "Big 12" },
  { canonicalName: "Cincinnati", espnId: "2132", aliases: ["Cincinnati", "Bearcats", "UC"], conference: "Big 12" },
  { canonicalName: "UCF", espnId: "2116", aliases: ["UCF", "Knights", "Central Florida"], conference: "Big 12" },
  { canonicalName: "Arizona", espnId: "12", aliases: ["Arizona", "Wildcats", "UA"], conference: "Big 12" },
  { canonicalName: "Arizona State", espnId: "9", aliases: ["Arizona State", "Sun Devils", "ASU"], conference: "Big 12" },
  { canonicalName: "Utah", espnId: "254", aliases: ["Utah", "Utes"], conference: "Big 12" },
  { canonicalName: "Colorado", espnId: "38", aliases: ["Colorado", "Buffaloes", "Buffs", "CU"], conference: "Big 12" },

  // Big East
  { canonicalName: "Connecticut", espnId: "41", aliases: ["Connecticut", "UConn", "Huskies"], conference: "Big East" },
  { canonicalName: "Villanova", espnId: "222", aliases: ["Villanova", "Wildcats", "Nova"], conference: "Big East" },
  { canonicalName: "Marquette", espnId: "269", aliases: ["Marquette", "Golden Eagles", "MU"], conference: "Big East" },
  { canonicalName: "Georgetown", espnId: "46", aliases: ["Georgetown", "Hoyas"], conference: "Big East" },
  { canonicalName: "Xavier", espnId: "2752", aliases: ["Xavier", "Musketeers", "X"], conference: "Big East" },
  { canonicalName: "Creighton", espnId: "156", aliases: ["Creighton", "Bluejays", "CU"], conference: "Big East" },
  { canonicalName: "St. John's", espnId: "2599", aliases: ["St. John's", "Saint John's", "Red Storm"], conference: "Big East" },
  { canonicalName: "Providence", espnId: "2507", aliases: ["Providence", "Friars", "PC"], conference: "Big East" },
  { canonicalName: "Butler", espnId: "2086", aliases: ["Butler", "Bulldogs"], conference: "Big East" },
  { canonicalName: "Seton Hall", espnId: "2550", aliases: ["Seton Hall", "Pirates"], conference: "Big East" },
  { canonicalName: "DePaul", espnId: "305", aliases: ["DePaul", "Blue Demons"], conference: "Big East" },

  // American / Other major
  { canonicalName: "Memphis", espnId: "235", aliases: ["Memphis", "Tigers"], conference: "American" },
  { canonicalName: "Gonzaga", espnId: "2250", aliases: ["Gonzaga", "Bulldogs", "Zags"], conference: "WCC" },
  { canonicalName: "Saint Mary's", espnId: "2608", aliases: ["Saint Mary's", "Gaels", "St. Mary's"], conference: "WCC" },
  { canonicalName: "San Diego State", espnId: "21", aliases: ["San Diego State", "Aztecs", "SDSU"], conference: "Mountain West" },
  { canonicalName: "Nevada", espnId: "2440", aliases: ["Nevada", "Wolf Pack"], conference: "Mountain West" },
];

async function main() {
  console.log("Seeding teams…");

  let created = 0;
  let updated = 0;

  for (const team of TEAMS) {
    const existing = await prisma.team.findUnique({
      where: { espnId: team.espnId },
    });

    if (existing) {
      await prisma.team.update({
        where: { espnId: team.espnId },
        data: { aliases: team.aliases, conference: team.conference },
      });
      updated++;
    } else {
      try {
        await prisma.team.create({
          data: {
            canonicalName: team.canonicalName,
            aliases: team.aliases,
            conference: team.conference,
            espnId: team.espnId,
          },
        });
        created++;
      } catch {
        // May conflict on canonicalName — update instead
        await prisma.team.upsert({
          where: { canonicalName: team.canonicalName },
          update: { espnId: team.espnId, aliases: team.aliases, conference: team.conference },
          create: {
            canonicalName: team.canonicalName,
            aliases: team.aliases,
            conference: team.conference,
            espnId: team.espnId,
          },
        });
        created++;
      }
    }
  }

  console.log(`Done. Created: ${created}, Updated: ${updated}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
