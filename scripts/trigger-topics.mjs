// Local triggers for the followed-topics jobs (needs `npx inngest-cli dev` against `npm run dev`).
//
//   node scripts/trigger-topics.mjs                       # refresh every keyword set now
//   node scripts/trigger-topics.mjs --briefs              # generate today's topic briefs
//   node scripts/trigger-topics.mjs --topic <userId> <keywordSetHash>   # one on-demand refresh
import { Inngest } from "inngest";

const inngest = new Inngest({ id: 'AlgoTest' });
const [flag, userId, hash] = process.argv.slice(2);

const event = flag === '--briefs'
    ? { name: 'app/generate.topic.briefs', data: {} }
    : flag === '--topic'
        ? { name: 'topic/refresh.requested', data: { userId, keywordSetHash: Number(hash) } }
        : { name: 'app/refresh.topic.feeds', data: {} };

if (flag === '--topic' && (!userId || !Number.isFinite(Number(hash)))) {
    console.error('Usage: node scripts/trigger-topics.mjs --topic <userId> <keywordSetHash>');
    process.exit(1);
}

inngest.send(event)
    .then(() => console.log(`Triggered '${event.name}' locally.`))
    .catch(console.error);
