import { formatDateShort, formatDateLong } from "@/lib/riff-utils";

const TUTORIAL_DEADLINE_DAYS = 14;

export function getTutorialDates(): {
  createdAt: string;
  deadline: string;
  deadlineDate: Date;
  pieceSubmittedAt: string;
  friendPieceUpdatedAt: string;
} {
  const now = new Date();
  const deadlineDate = new Date(
    now.getTime() + TUTORIAL_DEADLINE_DAYS * 24 * 60 * 60 * 1000
  );
  return {
    createdAt: formatDateShort(now),
    deadline: formatDateLong(deadlineDate),
    deadlineDate,
    pieceSubmittedAt: now.toISOString(),
    friendPieceUpdatedAt: new Date(
      now.getTime() - 12 * 60 * 1000
    ).toISOString(),
  };
}

export function getTutorialComments() {
  const comment1At = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const comment2At = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const comment3At = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  return [
    {
      id: "tutorial-comment-1",
      content: "Me start in cave",
      selectionStart: 315,
      selectionEnd: 327,
      selectedText: "inside jokes",
      authorId: "tutorial-friend",
      createdAt: comment1At,
      updatedAt: comment1At,
      author: TUTORIAL_FRIEND,
    },
    {
      id: "tutorial-comment-2",
      content: "Wild in the streets, runnin' runnin'",
      selectionStart: 415,
      selectionEnd: 432,
      selectedText: "freeing",
      authorId: "tutorial-friend",
      createdAt: comment2At,
      updatedAt: comment2At,
      author: TUTORIAL_FRIEND,
    },
    {
      id: "tutorial-comment-3",
      content: "It was Christmas Eve, babe...",
      selectionStart: 480,
      selectionEnd: 493,
      selectedText: "many years ago",
      authorId: "tutorial-friend",
      createdAt: comment3At,
      updatedAt: comment3At,
      author: TUTORIAL_FRIEND,
    },
  ];
}

export const TUTORIAL_RIFF = {
  title: "Learn to riff",
  prompt:
    "To prompt, or not to prompt? Riffs work both ways. If the host gives a prompt, it shows here.",
};

export const TUTORIAL_PIECE = {
  id: "tutorial-piece",
  title: "Write Something",
  coverImage: "/images/tutorial/Write-something.png",
  wordCount: 75,
};

export const TUTORIAL_FRIEND = {
  id: "tutorial-friend",
  name: "Riff",
  username: null,
  avatarUrl: "/apple-touch-icon.png",
};

export const TUTORIAL_PIECE_BASEBALL = {
  id: "tutorial-piece-baseball",
  title: "Baseball Love Letter",
  coverImage: "/images/tutorial/Baseball-Love-Letter.png",
  wordCount: 900,
};

export const TUTORIAL_PIECE_JAPAN = {
  id: "tutorial-piece-japan",
  title: "Japan Trip",
  coverImage: "/images/tutorial/Japan-Trip.png",
  wordCount: 99,
};

export const TUTORIAL_EDITOR_CONTENT = `<p>Write something. Literally anything.</p><p>Well, maybe not anything. Not thought leadership. Not &ldquo;content.&rdquo; Not something AI could have written. You&rsquo;re not trying to gain the attention of strangers here.</p><p>Write something for your friends. Something that only you could write. A story that only you can tell. With details and inside jokes that only your friends will get. The rest of the world doesn&rsquo;t have to get it. Because they won&rsquo;t see it. And that&rsquo;s incredibly freeing. That&rsquo;s the whole point.</p><p>Write about something that happened. Last week, or many years ago, because these are stories worth telling, that you&rsquo;d tell your friends anyways.</p><p>Write about what you&rsquo;re into lately. A new hobby or topic you&rsquo;re obsessed with. A piece of art or culture that you have strong opinions on. Something you read, watched, or listened to that really gets you going.</p><p>Write about what&rsquo;s on your mind. What are you thinking? How are you feeling? Because it feels good to get whatever&rsquo;s rattling around out of your head and onto the page. And it feels even better to feel understood by your friends.</p><p>Write with your friends because it&rsquo;s private, and creative, and fun. (And it deepens your friendships, but shhhhh, don&rsquo;t tell anyone that part. If they ask, just tell them it&rsquo;s fun.)</p>`;
