import type { Visual } from "@/lib/quiz/bank/questions";
import { SmsScreen } from "@/components/quiz/screenshots/mobile/SmsScreen";
import { EmailScreen } from "@/components/quiz/screenshots/web/EmailScreen";
import { UrlBar } from "@/components/quiz/screenshots/web/UrlBar";
import { InstagramAd } from "@/components/quiz/screenshots/mobile/InstagramAd";
import { AdListing } from "@/components/quiz/screenshots/web/AdListing";
import { CallScreen } from "@/components/quiz/screenshots/mobile/CallScreen";

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
