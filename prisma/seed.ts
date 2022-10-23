import { createCommission } from "../controllers/commission";
import { createEntity } from "../controllers/entity";
import { createUser } from "../controllers/user";

const root_path = './prisma/seed_data/';

const seedUser = async () => {
  await createUser('west', 'musky socks');

  console.log("Seeded user");
}

const seedEntities = async () => {
  const entities = [
    { name: "West", type: "CHARACTER", socials: [ { type: "TWITTER", value: "walkingcoatrack" }, { type: "TELEGRAM", value: "walkingcoatrack" } ] },
    { name: "Red", type: "CHARACTER", socials: [ { type: "TWITTER", value: "red_winds" } ] },
    { name: "Timber", type: "CHARACTER", socials: [ { type: "TWITTER", value: "airplanesleddog" } ] },
    { name: "Chewy", type: "ARTIST", socials: [{type: "TWITTER", value: "chewycuticle"}] },
    { name: "Arty", type: "ARTIST", socials: [{type: "TWITTER", value: "arterian"}] },
    { name: "Syber", type: "CHARACTER", socials: [ { type: "TWITTER", value: "syberxenon" } ] },
    { name: "Amp", type: "CHARACTER", socials: [ { type: "TWITTER", value: "leggypersecond" } ] },
    { name: "Kindled", type: "CHARACTER" },
    { name: "Julia", type: "CHARACTER" },
    { name: "Amethyst Dragon", type: "CHARACTER" },
    { name: "Raiz", type: "CHARACTER" },
    { name: "Zeeb", type: "CHARACTER" },
  ];

  // Seed characters
  await createEntity(entities[0]);
  await createEntity(entities[1]);
  await createEntity(entities[2]);
  
  // Seed artists
  await createEntity(entities[3]);
  await createEntity(entities[4]);

  const supp_ents = entities.slice(5);
  await Promise.all(supp_ents.map(e => createEntity(e)));

  console.log("Seeded entities");
}

const seedCommission = async () => {
  const invoice = { filepath: `${root_path}invoice.pdf`, filename: 'invoice.pdf', size: 64751, contentType: 'application/pdf' };
  const incomplete_commissions = [
    { dateCommissioned: Date(), price: 100, nsfw: false, artistId: 4, characterIds: [1], invoice },
    { dateCommissioned: Date(), price: 150, nsfw: true,  artistId: 4, characterIds: [1], invoice },
    { dateCommissioned: Date(), price: 200, nsfw: false, artistId: 5, characterIds: [1], invoice },
  ]

  const complete_commissions = [
    { invoice, dateCommissioned: Date(), price: 100, nsfw: false, characterIds: [1], artistId: 5, title: "Gassed", description: "Trapped behind that glass", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c1.jpg`, filename: 'c1.jpg', size: 206507, contentType: 'image/jpg', }] } ] },
    { invoice, dateCommissioned: Date(), price: 110, nsfw: true,  characterIds: [1, 2, 3], artistId: 4, title: "Down", description: "Those pesky RAs...", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c2.png`, filename: 'c2.png', size: 278496, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 120, nsfw: true,  characterIds: [1], artistId: 4, title: "Team Player", description: "New cheerleaders are just so hard to come by these days", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c3.jpg`, filename: 'c3.jpg', size: 569341, contentType: 'image/jpg', }] } ] },
    { invoice, dateCommissioned: Date(), price: 130, nsfw: false, characterIds: [1], artistId: 5, title: "Experimental", description: "This new round of VR is more immersive than ever", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c4.jpg`, filename: 'c4.jpg', size: 197256, contentType: 'image/jpg', }] } ] },
    { invoice, dateCommissioned: Date(), price: 140, nsfw: true,  characterIds: [1], artistId: 5, title: "Lumber", description: "Timber!", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c5.png`, filename: 'c5.png', size: 653896, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 150, nsfw: false, characterIds: [1], artistId: 4, title: "Smoke n Stroke", description: "What better to wind down with then that", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c6.png`, filename: 'c6.png', size: 958113, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 160, nsfw: true,  characterIds: [1, 3], artistId: 5, title: "Admiring", description: "The towns people are finally learning their place", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c7.png`, filename: 'c7.png', size: 1151255, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 170, nsfw: true,  characterIds: [1, 3], artistId: 4, title: "Post Game", description: "After the game, its best to ensure that your teammates didnt overexhurt themselves", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c8.png`, filename: 'c8.png', size: 1313309, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 180, nsfw: true,  characterIds: [1, 2], artistId: 5, title: "Public Piss", description: "Hypnosis can't just be all fun behind closed doors, now could it...", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c9.png`, filename: 'c9.png', size: 200209, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 190, nsfw: false, characterIds: [1, 2], artistId: 5, title: "Roommate Relax", description: "Getting back from classes for the day and helping the roomie have a good time on the couch", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c10.png`,filename: 'c10.png',size: 1160806, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 200, nsfw: true,  characterIds: [1, 2, 3], artistId: 4, title: "Down and Out", description: "Finally an app Id pay for", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c11.png`,filename: 'c11.png',size: 1742594, contentType: 'image/png', }] } ] },
    { invoice, dateCommissioned: Date(), price: 210, nsfw: false, characterIds: [1, 2, 3], artistId: 5, title: "Frolic", description: "The seedy happening of gay clubs totally have to be like this, Im sure", dateReceived: Date(), thumbnailLabel: 'primary', images: [ { name: "primary", alternates: [{ filepath: `${root_path}c12.png`,filename: 'c12.png',size: 1235656, contentType: 'image/png', }] } ] },
  ]

  await Promise.all([...incomplete_commissions.map(c => createCommission(c)), ...complete_commissions.map(c => createCommission(c))]);
  console.log("Seeded commissions");
}

const run = async () => {
  await seedUser();
  await seedEntities();
  await seedCommission();

  process.exit(0);
}

run();
