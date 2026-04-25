import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import "./legal_pages.css";

const SUPPORT_EMAIL = "contact@carvver.com";

const PAGES = {
  terms: {
    title: "Terms",
    intro:
      "These terms explain how Carvver works for customers, freelancers, and teams using the marketplace.",
    slides: [
      "Keep listings honest and specific.",
      "Use platform orders, messages, and delivery records for paid work.",
      "Carvver may review activity that affects trust, safety, payouts, or account access.",
    ],
    sections: [
      {
        title: "Using Carvver",
        body:
          "Carvver helps customers discover providers, post requests, message, order, pay, review work, and manage account activity. Use the platform in a way that is truthful, lawful, and respectful of other users.",
      },
      {
        title: "Accounts",
        body:
          "You are responsible for the details, password, and activity tied to your account. Customers and freelancers may need to finish onboarding before accessing protected marketplace tools.",
      },
      {
        title: "Listings and requests",
        body:
          "Freelancers must describe their services, pricing, timelines, media, and fulfillment details accurately. Customers must describe requests clearly enough for providers to understand the work before responding.",
      },
      {
        title: "Orders and payments",
        body:
          "Customer payments are collected through Carvver-supported checkout and held through the order flow. Delivery, confirmation, cancellation, refund, and dispute handling depend on the order record and platform review.",
      },
      {
        title: "Payouts",
        body:
          "Freelancer payouts are not treated as released until payout processing succeeds. Carvver may pause or review payout activity when an order, delivery, account, or payment signal needs attention.",
      },
      {
        title: "Trust and verification",
        body:
          "Verification badges, achievements, profile signals, reviews, and listing status help customers read credibility. These signals may be changed or removed when information is incomplete, misleading, or no longer valid.",
      },
      {
        title: "Reviews and content",
        body:
          "Reviews, messages, images, listing copy, and request details should reflect real activity. Carvver may moderate content that is abusive, misleading, unsafe, spammy, or unrelated to the marketplace.",
      },
      {
        title: "Plans and fees",
        body:
          "Public plans may include Basic, Carvver Pro, and Business options. Features, commissions, support priority, and pricing follow the current plan shown on Carvver when the user chooses it.",
      },
      {
        title: "Disputes and refunds",
        body:
          "When something goes wrong, Carvver may review messages, order details, delivery records, payment state, and account history before deciding whether to release, refund, pause, or follow up.",
      },
      {
        title: "Prohibited conduct",
        body:
          "Do not use Carvver for scams, fake profiles, copied work, harassment, illegal goods or services, payment avoidance, platform abuse, or attempts to bypass trust and safety checks.",
      },
      {
        title: "Account limits",
        body:
          "Carvver may limit, suspend, or close access when activity creates risk for customers, freelancers, payments, platform operations, or other users.",
      },
      {
        title: "Changes",
        body:
          "Carvver may update these terms as the platform grows. Continued use of the platform means the updated terms apply from the effective date shown here.",
      },
    ],
  },
  privacy: {
    title: "Privacy Policy",
    intro:
      "This policy explains what Carvver collects and how that information supports marketplace discovery, orders, trust, and support.",
    slides: [
      "Profile details help people understand who they are working with.",
      "Order and payment records keep transactions traceable.",
      "Support uses account context to resolve issues clearly.",
    ],
    sections: [
      {
        title: "Information collected",
        body:
          "Carvver may collect account details, profile fields, email address, location fields, listing and request content, media, messages, favorites, cart activity, orders, reviews, billing records, and verification materials.",
      },
      {
        title: "How Carvver uses it",
        body:
          "Information is used to run accounts, show marketplace pages, match discovery, support checkout, manage orders, process payouts, send account emails, improve safety, and respond to support requests.",
      },
      {
        title: "Marketplace visibility",
        body:
          "Public-facing profile, listing, request, badge, review, media, and location details may be visible where they help customers and freelancers evaluate fit and trust.",
      },
      {
        title: "Payments and orders",
        body:
          "Checkout, payment reference, delivery, completion, refund, and payout records are kept so both sides can follow what happened and so Carvver can review payment-related issues.",
      },
      {
        title: "Messages and support",
        body:
          "Messages and support details may be used to help with account access, orders, verification, payouts, disputes, safety review, and platform troubleshooting.",
      },
      {
        title: "Service providers",
        body:
          "Carvver uses service providers such as Supabase for platform data and authentication, PayMongo for payments, and Resend through Supabase Auth for account email delivery.",
      },
      {
        title: "Retention and security",
        body:
          "Carvver keeps information while it is needed for accounts, marketplace records, order history, compliance, support, and safety. Access controls and platform safeguards are used to protect stored data.",
      },
      {
        title: "User choices",
        body:
          "Users can update account details in settings, request password recovery, change email through confirmation, manage listings or requests, and contact support about account or data questions.",
      },
      {
        title: "Contact",
        body: `Privacy questions can be sent to ${SUPPORT_EMAIL}. Include the account email and the specific request so the team can review the right record.`,
      },
    ],
  },
  contact: {
    title: "Contact Us",
    intro:
      "Reach Carvver support for account access, marketplace orders, payouts, verification, listings, requests, and payment-related review.",
    slides: [
      "Use the email connected to your Carvver account when possible.",
      "Include order, listing, or request details if the issue is about a transaction.",
      "Keep screenshots or delivery records ready when they help explain the issue.",
    ],
    contact: true,
    sections: [
      {
        title: "Account access",
        body:
          "Use support when sign-in, email confirmation, password recovery, onboarding, or account role access needs review.",
      },
      {
        title: "Orders and payments",
        body:
          "Send the order context when a checkout, receipt, delivery confirmation, cancellation, refund, or payment status needs attention.",
      },
      {
        title: "Payouts",
        body:
          "Freelancers can ask about payout readiness, payout release status, or payment records tied to completed orders.",
      },
      {
        title: "Verification",
        body:
          "Use contact support when verification documents, trust signals, badges, or profile review need a closer look.",
      },
      {
        title: "Listings and requests",
        body:
          "Ask for help when a service listing, customer request, media upload, category, location detail, or public profile is not behaving as expected.",
      },
    ],
  },
  help: {
    title: "Help Center",
    intro:
      "Quick guidance for using Carvver across discovery, posting, orders, trust, and account management.",
    slides: [
      "Start with a complete profile.",
      "Keep listing and request details specific.",
      "Use Carvver messages and order records for important decisions.",
    ],
    help: true,
    topics: [
      {
        title: "Getting started",
        items: [
          {
            question: "Do I need an account?",
            answer:
              "Public pages can be viewed without signing in. Marketplace actions such as posting, saving, messaging, ordering, and checkout need an account.",
          },
          {
            question: "What happens after sign up?",
            answer:
              "Carvver sends an email confirmation step, then guides customers or freelancers through any required onboarding before protected tools open.",
          },
        ],
      },
      {
        title: "Finding providers",
        items: [
          {
            question: "How do customers compare providers?",
            answer:
              "Customers can review categories, listing details, media, location, profile proof, badges, reviews, and price before opening an order.",
          },
          {
            question: "Can I save providers?",
            answer:
              "Customer accounts include saved favorites so promising providers or listings can be revisited later.",
          },
        ],
      },
      {
        title: "Posting listings",
        items: [
          {
            question: "What should a listing include?",
            answer:
              "A strong listing includes a clear title, category, description, pricing, delivery details, media, and the context a customer needs before ordering.",
          },
          {
            question: "How does sharing work?",
            answer:
              "Listings and requests can be shared outward with a Carvver link. Facebook uses the preview title and description generated from the platform post.",
          },
        ],
      },
      {
        title: "Customer requests",
        items: [
          {
            question: "What are requests for?",
            answer:
              "Requests let customers describe custom work so freelancers can review the need and respond with interest.",
          },
          {
            question: "What makes a good request?",
            answer:
              "Include the work needed, budget, category, timeline, location when relevant, and any media that makes the scope easier to understand.",
          },
        ],
      },
      {
        title: "Payments and orders",
        items: [
          {
            question: "When does payment move?",
            answer:
              "Customer payment is collected first and connected to the order flow. Freelancer payout is handled after completion and successful release processing.",
          },
          {
            question: "Where should delivery details go?",
            answer:
              "Use the order delivery fields and Carvver messages so important notes, links, tracking, proof, and confirmation stay attached to the order.",
          },
        ],
      },
      {
        title: "Trust and safety",
        items: [
          {
            question: "What do badges mean?",
            answer:
              "Badges and achievements help customers read provider progress and trust signals faster. Verified badges reflect additional review.",
          },
          {
            question: "How are issues reviewed?",
            answer:
              "Carvver can review order records, messages, delivery details, payment state, and account history when an issue needs support.",
          },
        ],
      },
      {
        title: "Account help",
        items: [
          {
            question: "Can I change my email?",
            answer:
              "Customer settings support email changes through confirmation. Password recovery also uses the email connected to the account.",
          },
          {
            question: "How do I contact support?",
            answer: `Email ${SUPPORT_EMAIL} with your account email and the listing, request, or order details connected to the issue.`,
          },
        ],
      },
    ],
  },
};

function Reveal({ children, className = "", delay = 0, amount = 0.22 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount });
  const reduceMotion = useReducedMotion();
  const active = inView || reduceMotion;

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18, filter: "blur(10px)" }}
      animate={active ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
      transition={{ duration: 0.56, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </Motion.div>
  );
}

function TextCarousel({ items }) {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeItem = items[activeIndex];

  useEffect(() => {
    if (reduceMotion || items.length <= 1) return undefined;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % items.length);
    }, 3600);

    return () => window.clearInterval(timer);
  }, [items.length, reduceMotion]);

  return (
    <div className="legalCarousel">
      <div className="legalCarousel__stage">
        <AnimatePresence mode="wait">
          <Motion.p
            key={activeItem}
            className="legalCarousel__text"
            initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {activeItem}
          </Motion.p>
        </AnimatePresence>
      </div>

      <div className="legalCarousel__controls" aria-label="Page highlights">
        {items.map((item, index) => (
          <button
            key={item}
            type="button"
            className={`legalCarousel__control ${
              index === activeIndex ? "legalCarousel__control--active" : ""
            }`}
            onClick={() => setActiveIndex(index)}
            aria-label={`Show highlight ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

function SectionAccordion({ sections }) {
  const [openIndex, setOpenIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  return (
    <div className="legalList">
      {sections.map((section, index) => {
        const open = openIndex === index;

        return (
          <Motion.article
            key={section.title}
            className={`legalList__item ${open ? "legalList__item--open" : ""}`}
            layout
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
          >
            <button
              type="button"
              className="legalList__trigger"
              onClick={() => setOpenIndex(open ? -1 : index)}
              aria-expanded={open}
            >
              <span className="legalList__index">{String(index + 1).padStart(2, "0")}</span>
              <span className="legalList__title">{section.title}</span>
              <ChevronDown className="legalList__chevron" aria-hidden="true" />
            </button>

            <AnimatePresence initial={false}>
              {open ? (
                <Motion.div
                  className="legalList__content"
                  initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p>{section.body}</p>
                </Motion.div>
              ) : null}
            </AnimatePresence>
          </Motion.article>
        );
      })}
    </div>
  );
}

function ContactPanel({ sections }) {
  return (
    <div className="legalContact">
      <div className="legalContact__primary">
        <p className="legalContact__label">Support email</p>
        <a className="legalContact__mail" href={`mailto:${SUPPORT_EMAIL}`}>
          {SUPPORT_EMAIL}
        </a>
        <a
          className="legalContact__action"
          href={`mailto:${SUPPORT_EMAIL}?subject=Carvver%20Support%20Request`}
        >
          Email support
          <ArrowRight className="legalContact__arrow" aria-hidden="true" />
        </a>
      </div>
      <SectionAccordion sections={sections} />
    </div>
  );
}

function HelpTopics({ topics }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTopic = topics[activeIndex];
  const sections = useMemo(
    () =>
      activeTopic.items.map((item) => ({
        title: item.question,
        body: item.answer,
      })),
    [activeTopic]
  );

  return (
    <div className="legalHelp">
      <div className="legalHelp__tabs" aria-label="Help topics">
        {topics.map((topic, index) => (
          <button
            key={topic.title}
            type="button"
            className={`legalHelp__tab ${index === activeIndex ? "legalHelp__tab--active" : ""}`}
            onClick={() => setActiveIndex(index)}
          >
            {topic.title}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <Motion.div
          key={activeTopic.title}
          className="legalHelp__answers"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        >
          <SectionAccordion sections={sections} />
        </Motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function LegalPage({ page = "terms" }) {
  const content = PAGES[page] || PAGES.terms;

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.title = `${content.title} | Carvver`;

    return () => {
      document.title = "carvver";
    };
  }, [content.title]);

  return (
    <>
      <div className="legalPage__base" aria-hidden="true" />
      <main className="legalPage">
        <section className="legalHero">
          <div className="legalWrap legalHero__layout">
            <Reveal className="legalHero__copy" amount={0.3}>
              <h1 className="legalHero__title">{content.title}</h1>
              <p className="legalHero__intro">{content.intro}</p>
              <p className="legalHero__date">Effective April 25, 2026</p>
            </Reveal>
            <Reveal className="legalHero__motion" delay={0.08} amount={0.3}>
              <TextCarousel items={content.slides} />
            </Reveal>
          </div>
        </section>

        <section className="legalBody">
          <div className="legalWrap">
            <Reveal>
              {content.contact ? (
                <ContactPanel sections={content.sections} />
              ) : content.help ? (
                <HelpTopics topics={content.topics} />
              ) : (
                <SectionAccordion sections={content.sections} />
              )}
            </Reveal>
          </div>
        </section>
      </main>
    </>
  );
}
