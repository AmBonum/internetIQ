import type { Course } from "@/content/courses";

const CATEGORY_LABEL: Record<Course["category"], string> = {
  sms: "SMS",
  email: "Email",
  voice: "Telefón",
  marketplace: "Marketplace",
  investicie: "Investície",
  vztahy: "Vzťahy",
  data: "Data hygiene",
  obecne: "Všeobecné",
};

export function CourseHero({ course }: { course: Course }) {
  return (
    <header className="mb-10 text-center">
      <div className="text-7xl">{course.heroEmoji}</div>
      <h1 className="mt-4 text-4xl font-black sm:text-5xl">{course.title}</h1>
      <p className="mt-3 text-base text-muted-foreground sm:text-lg">{course.tagline}</p>
      <p className="mt-4 text-sm text-muted-foreground">
        <span aria-label="Doba čítania">⏱ {course.estimatedMinutes} min</span>
        {" · "}
        <span>{course.difficulty}</span>
        {" · "}
        <span>{CATEGORY_LABEL[course.category]}</span>
      </p>
    </header>
  );
}
