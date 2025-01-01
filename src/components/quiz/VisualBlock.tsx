import type { Visual } from "@/lib/quiz/questions";
import { SmsScreen } from "./screenshots/SmsScreen";
import { EmailScreen } from "./screenshots/EmailScreen";
import { UrlBar } from "./screenshots/UrlBar";
import { InstagramAd } from "./screenshots/InstagramAd";
import { AdListing } from "./screenshots/AdListing";
import { CallScreen } from "./screenshots/CallScreen";

/**
 * Visual context for a quiz question (SMS, email, URL bar, IG ad, listing,
 * call screen, plain text). Pure render — used in both the live test
 * (QuestionCard) and the post-test review (AnswerReviewCard).
 */
export function VisualBlock({ visual }: { visual: Visual }) {
  switch (visual.kind) {
    case "sms":
      return (
        <SmsScreen
          sender={visual.sender}
          body={visual.body}
          link={visual.link}
          time={visual.time}
        />
      );
    case "email":
      return (
        <EmailScreen
          from={visual.from}
          fromEmail={visual.fromEmail}
          subject={visual.subject}
          body={visual.body}
          cta={visual.cta}
        />
      );
    case "url":
      return <UrlBar url={visual.url} secure={visual.secure} />;
    case "instagram":
      return (
        <InstagramAd
          account={visual.account}
          verified={visual.verified}
          body={visual.body}
          cta={visual.cta}
          imageEmoji={visual.imageEmoji}
          price={visual.price}
        />
      );
    case "listing":
      return (
        <AdListing
          site={visual.site}
          title={visual.title}
          price={visual.price}
          location={visual.location}
          description={visual.description}
          imageEmoji={visual.imageEmoji}
        />
      );
    case "call":
      return <CallScreen caller={visual.caller} number={visual.number} hint={visual.hint} />;
    case "text":
      return (
        <div className="rounded-xl border border-border/80 bg-card p-4 text-sm shadow-card whitespace-pre-line">
          <div className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
            {visual.label}
          </div>
          <div className="text-foreground/90">{visual.body}</div>
        </div>
      );
  }
}
