const _MOCK_JAMS_DATA = [
  {
    content: "Convenience camping",
    timestamp: "today",
    url: null,
    note: "The bar for camping is too high and nobody talks about it. You need a week off, a campsite booked six months in advance, a cooler full of groceries, and the mental energy to cook over a fire three times a day. No wonder most people just don't go.\n\nBut here's what actually works: drive less than an hour, find a state park with availability, bring nothing but sleeping bags and a change of clothes. Eat breakfast at a diner. Get tacos for dinner from whatever's in town. The point was never the camp cooking — the point was sleeping in a tent.\n\nTwenty-four hours is enough. You still get the thing where your phone loses signal and you stop reaching for it out of habit. You still wake up to birds instead of notifications. You still watch your kids do something genuinely unstructured for the first time in weeks. You still fall asleep earlier than you have in months.\n\nThe benefits of camping are not about roughing it. They're about being outside, slowing down, and sleeping somewhere different. None of that requires a week of planning. It just requires actually going.",
  },
  {
    content: "Troncones, MX",
    timestamp: "2 days ago",
    url: null,
    note: "Troncones is a tiny surf town on Mexico's Pacific coast that most people have never heard of, which is exactly why it's magic. No resort strip, no cruise ships, no all-inclusive anything — just a dirt road, a handful of palapa restaurants, and some of the most consistent waves I've ever paddled into. You get there by driving two hours north of Zihuatanejo on a road that Google Maps confidently tells you is a highway. It is not a highway. But you arrive and immediately forget the drive ever happened.\n\nThe town runs on a loose schedule. Breakfast whenever the kitchen feels like it. Surf in the morning before the wind picks up. Hammock in the afternoon. Mezcal at sunset, which happens to be genuinely spectacular every single night, like someone out there is showing off. The people who live there have chosen it deliberately — expats who left somewhere faster and never looked back, locals who know they're sitting on something special and aren't in any rush to tell the internet about it.\n\nI've been to places that call themselves hidden gems and mean they got a write-up in Condé Nast last spring. Troncones is the real thing. Go before someone ruins it. Or don't tell me if they already have.",
  },
  {
    content: "World Baseball Classic",
    timestamp: "1 week ago",
    url: null,
    note: "Something about the WBC that regular season baseball just can't touch. The flag-waving, the genuine emotion, the fact that players are actually fired up about winning — it's infectious. Dominican fans going insane over a bunt. Japanese players celebrating like it's the last game ever played. Somehow a March tournament feels like the most important baseball of the year. The sport needed this and I'm glad it exists. Every country brings something different to the game, and watching it all collide in one bracket is genuinely electric. Nothing else like it.",
  },
  {
    content: "Sable fABLE — Bon Iver",
    timestamp: "3 weeks ago",
    url: "https://open.spotify.com/album/5fQQLuMQmYKmmMFKfOgFCz",
    note: "I've been cycling through this album for weeks and I still can't pick a favorite song. Every listen it's different — sometimes it's the opener, sometimes it's the way a track builds and then just disappears. Justin Vernon does something where the album rewards patience in a way most music doesn't anymore. It makes you want to sit still and actually listen, which feels rare. There's a texture to it that I haven't heard from him before — less fragmented than some of the recent stuff, more willing to just let a melody land and breathe. The production is dense but it never feels cluttered. I keep coming back to the closer especially. It does that thing where it feels like it's ending three different times before it finally lets go. That's the kind of craft that makes you want to just start it over.",
  },
  {
    content: "Project Hail Mary",
    timestamp: "2 months ago",
    url: "https://www.goodreads.com/book/show/54493401-project-hail-mary",
    note: "My favorite book of the year, and I just watched the movie too. Andy Weir does something rare — he makes you genuinely care about the science, the problem-solving, the characters doing it. The story earns every twist because the rules are established early and followed honestly. Nothing comes out of nowhere. I don't want to say anything else because going in blind is the whole experience. What I will say is that there's a friendship at the center of this book that hit me harder than most relationships I've read in literary fiction. Weir isn't trying to be a literary writer, and somehow that restraint is what makes the emotional moments land so cleanly. There's no ornamentation — just two beings trying to figure something out together. The movie captures more than I expected it to. Some adaptations sand down what made the source material work, but this one understood what the book was actually about and built toward it faithfully. I left the theater wanting to read the whole thing again from the beginning, which almost never happens.",
  },
];

// TODO: replace with real Jam data from DB when backend is ready
// Swap the active line to test different states:
// export const MOCK_JAMS = _MOCK_JAMS_DATA.slice(0, 0); // empty state
// export const MOCK_JAMS = _MOCK_JAMS_DATA.slice(0, 1); // 1 jam only
export const MOCK_JAMS = _MOCK_JAMS_DATA; // all 5 jams
