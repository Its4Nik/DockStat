import { Link } from "react-router";
import { Card, CardBody, CardHeader } from "./Card";

export type NavCard = {
  label: string;
  bgColorFrom: string;
  bgColorTo: string
  textColor: string;
  links: {
    label: string;
    ariaLabel: string;
    href: string;
    icon?: React.ReactNode;
  }[];
};

type NavCardsProps = {
  cards: NavCard[];
};

export default function NavCards({ cards }: NavCardsProps) {
  return (
    <div className="flex flex-row gap-4">
      {cards.map(({ label, links }) => (
        <Card key={label} >
          <CardHeader>
            {label}
          </CardHeader>
          <CardBody>
            {links.map(({ label, href, icon, ariaLabel }) => (
              <Link
                to={href}
                key={label}
                aria-label={ariaLabel}
                className="flex flex-row items-center gap-2"
              >
                {icon && <div className="w-4 h-4 flex items-center justify-center">{icon}</div>}
                <span className="text-accent hover:underline">{label}</span>
              </Link>
            ))}
          </CardBody>
        </Card>
      ))
      }
    </div >
  );
}
