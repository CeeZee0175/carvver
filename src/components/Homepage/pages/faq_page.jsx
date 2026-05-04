import React, { useRef, useState } from "react";
import { AnimatePresence, motion as Motion, useInView, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import "./faq_page.css";

const FAQ_SECTIONS = [
  {
    id: "about",
    title: "About Carvver",
    items: [
      {
        id: "01",
        question: "What is Carvver?",
        answer:
          "Carvver is a Filipino marketplace for handmade sellers, hobbyists, and growing freelancers who want a clearer place to offer work and for customers who want a safer way to discover and book them. It brings listings, trust signals, messaging, and transaction flow into one product surface.",
      },
      {
        id: "02",
        question: "Who is Carvver for?",
        answer:
          "Carvver is built for creators still building momentum, from handmade-product providers to casual freelancers, and for customers who want to find trustworthy providers without piecing everything together across several social platforms.",
      },
      {
        id: "03",
        question: "How is Carvver different from larger freelance marketplaces?",
        answer:
          "Carvver is more local, more creator-first, and less corporate in tone. It focuses on trust that reads quickly, location-aware discovery, few-click posting for promotion, and a calmer badge-based growth model instead of pushing people into a noisy leaderboard race.",
      },
    ],
  },
  {
    id: "discovery",
    title: "Listings and Discovery",
    items: [
      {
        id: "01",
        question: "How do customers find providers on Carvver?",
        answer:
          "Customers can browse by category, compare profile proof, reviews, badges, and listing details, and use location-aware discovery when nearby or on-site work matters. The goal is to make trust and fit easier to read before checkout.",
      },
      {
        id: "02",
        question: "What are customer requests?",
        answer:
          "Customer requests let buyers post what they need so providers can respond with interest. It gives customers another path besides browsing fixed listings, especially when the work is custom or they want providers to come to them.",
      },
      {
        id: "03",
        question: "What can a provider include in a listing?",
        answer:
          "Providers can build out listings with service details, package information, portfolio-style media, samples or teasers, and the context customers need to understand what is being offered. Listings are meant to show proof of work, not just a short caption.",
      },
      {
        id: "04",
        question: "What is few-click posting?",
        answer:
          "Few-click posting is Carvver's promotion feature for providers. Instead of rebuilding the same offer across multiple channels, a provider can extend one listing outward more quickly so the work can travel farther while still pointing back to Carvver.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments and Orders",
    items: [
      {
        id: "01",
        question: "How do payments work on Carvver?",
        answer:
          "Customer payments are collected first and held instead of going straight to the provider. That hold gives both sides a clearer order flow, supports confirmation before release, and makes dispute or refund handling easier when something goes wrong.",
      },
      {
        id: "02",
        question: "When does a freelancer receive payment?",
        answer:
          "A freelancer is not marked paid the moment a customer finishes checkout. After the customer confirms receipt or marks the order complete, the payout is queued for ops release. It only becomes released after payout processing succeeds.",
      },
      {
        id: "03",
        question: "What happens if there is a problem with an order?",
        answer:
          "Because payment is held first, Carvver can review what happened before release. That makes it easier to pause a payout, review structured delivery details, and handle refunds or follow-up more cleanly than if the money had already moved immediately.",
      },
      {
        id: "04",
        question: "How are digital and physical deliveries handled?",
        answer:
          "Carvver supports both. Digital orders use structured handoff details like a delivery note, deliverable label, link, and optional access code. Physical orders use shipment details such as courier, tracking reference, shipment note, and optional proof.",
      },
    ],
  },
  {
    id: "trust",
    title: "Trust and Credibility",
    items: [
      {
        id: "01",
        question: "What are verified badges?",
        answer:
          "Verified badges are trust signals for providers whose legitimacy has gone through review. They help customers read credibility faster and feel more confident that the provider's offer is real before placing an order.",
      },
      {
        id: "02",
        question: "What are achievements and badges?",
        answer:
          "Achievements and badges celebrate progress on the platform. They are meant to make growth feel rewarding and visible without turning Carvver into a public ranking contest where creators have to compete for attention through a leaderboard.",
      },
      {
        id: "03",
        question: "Can customers leave reviews?",
        answer:
          "Yes. Reviews are part of the credibility layer on Carvver and help future customers understand what previous transactions felt like. Alongside profile proof and badges, they help trust build more naturally over time.",
      },
      {
        id: "04",
        question: "How does Carvver reduce scams?",
        answer:
          "Carvver reduces scam risk through held payments, clearer order flow, verified badges, reviews, structured delivery records, and a more readable trust layer overall. The idea is to protect both discovery and checkout, not just one part of the experience.",
      },
    ],
  },
  {
    id: "accounts",
    title: "Accounts, Plans, and Support",
    items: [
      {
        id: "01",
        question: "Do I need an account to use Carvver?",
        answer:
          "You can view Carvver's public brand pages without signing in, but marketplace actions need an account. Signing up is required for posting listings or requests, saving favorites, messaging, managing orders, and checking out inside the platform.",
      },
      {
        id: "02",
        question: "What happens after sign up?",
        answer:
          "After sign up, Carvver sends an email confirmation step. The public sign-up flow now routes to a success page that tells the user to check their email, then returns them to sign in after the countdown or via a manual link.",
      },
      {
        id: "03",
        question: "What plans does Carvver offer?",
        answer:
          "Carvver currently shows three public plans: Basic, Carvver Pro, and Business. Pro is P149 per month and Business is P1,500 per month. On the freelancer side, Carvver Pro removes the standard 5% platform commission.",
      },
      {
        id: "04",
        question: "How can I get help if something goes wrong?",
        answer:
          "Support is part of the platform experience for account issues, order concerns, and payout-related follow-up. Customers and providers can use the platform's support flow when something needs review, and higher paid plans surface stronger priority support handling.",
      },
    ],
  },
];

function Reveal({ children, className = "", delay = 0, amount = 0.24 }) {
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
      transition={{ duration: 0.58, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {typeof children === "function" ? children(active) : children}
    </Motion.div>
  );
}

function AccentLine({ className }) {
  return <span className={className} aria-hidden="true" />;
}

function SectionHeading({ title }) {
  return (
    <div className="faqSectionHead">
      <div className="faqSectionHead__titleWrap">
        <h2 className="faqSectionHead__title">{title}</h2>
        <AccentLine className="faqSectionHead__line" />
      </div>
    </div>
  );
}

function AccordionItem({ item, open, onToggle }) {
  const reduceMotion = useReducedMotion();

  return (
    <Motion.article
      layout
      className={`faqAccordion__item ${open ? "faqAccordion__item--open" : ""}`}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
    >
      <button type="button" className="faqAccordion__trigger" onClick={() => onToggle(item.id)}>
        <span className="faqAccordion__index" aria-hidden="true">
          {item.id}
        </span>
        <span className="faqAccordion__title">{item.question}</span>
        <ChevronDown className={`faqAccordion__chevron ${open ? "faqAccordion__chevron--open" : ""}`} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <Motion.div
            key="content"
            className="faqAccordion__content"
            initial={reduceMotion ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="faqAccordion__body">{item.answer}</p>
          </Motion.div>
        ) : null}
      </AnimatePresence>
    </Motion.article>
  );
}

export default function FaqPage() {
  const [openItems, setOpenItems] = useState(
    Object.fromEntries(FAQ_SECTIONS.map((section) => [section.id, section.items[0]?.id || ""]))
  );

  const handleToggle = (sectionId, itemId) => {
    setOpenItems((current) => ({
      ...current,
      [sectionId]: current[sectionId] === itemId ? "" : itemId,
    }));
  };

  return (
    <>
      <div className="faqPage__base" aria-hidden="true" />
      <div className="faqPage__bg" aria-hidden="true" />

      <main className="faqPage">
        <div className="faqPage__decor faqPage__decor--a" aria-hidden="true" />
        <div className="faqPage__decor faqPage__decor--b" aria-hidden="true" />
        <div className="faqPage__decor faqPage__decor--c" aria-hidden="true" />

        <section className="faqHero faqBand">
          <div className="faqWrap faqHero__layout">
            <Reveal className="faqHero__copy" amount={0.3}>
              <>
                <div className="faqHero__titleWrap">
                  <h1 className="faqHero__title">FAQ</h1>
                  <AccentLine className="faqHero__line" />
                </div>
                <p className="faqHero__sub">
                  Find quick answers about how Carvver works, from discovery and listings to safer
                  payments, trust signals, and support.
                </p>
              </>
            </Reveal>
          </div>
        </section>

        {FAQ_SECTIONS.map((section, sectionIndex) => (
          <section key={section.id} className="faqBand faqSection">
            <div className="faqWrap">
              <Reveal delay={sectionIndex * 0.03}>
                <SectionHeading title={section.title} />
              </Reveal>
              <div className="faqAccordion">
                {section.items.map((item, index) => (
                  <Reveal key={`${section.id}-${item.id}`} delay={0.04 * index}>
                    <AccordionItem
                      item={item}
                      open={openItems[section.id] === item.id}
                      onToggle={(nextItemId) => handleToggle(section.id, nextItemId)}
                    />
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
