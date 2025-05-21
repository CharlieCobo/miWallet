import { Accordion, AccordionItem } from '@heroui/react';
import { BanknoteArrowDown, BanknoteArrowUp, HandCoins } from 'lucide-react';
import type { SVGProps } from 'react';
import type { JSX } from 'react/jsx-runtime';
import { useIncome } from '../../hooks/use-income';

const InfoIcon = (props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) => {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      height="24"
      role="presentation"
      viewBox="0 0 24 24"
      width="24"
      {...props}
    >
      <path
        d="M12 22C17.5 22 22 17.5 22 12C22 6.5 17.5 2 12 2C6.5 2 2 6.5 2 12C2 17.5 6.5 22 12 22Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M12 8V13" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
      <path
        d="M11.9945 16H12.0035"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
};

export default function Acordion() {
  const incomes = useIncome(state => state.incomes);

  const itemClasses = {
    base: 'py-0 w-full',
    title: 'font-normal text-medium',
    trigger: 'px-2 py-0 data-[hover=true]:bg-default-100 rounded-lg h-14 flex items-center',
    indicator: 'text-medium',
    content: 'text-small px-2',
  };

  const defaultContent =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.';

  return (
    <Accordion
      className="p-2 flex flex-col gap-1 m-auto max-w-[300px]"
      itemClasses={itemClasses}
      showDivider={false}
      variant="shadow"
    >
      <AccordionItem
        key="1"
        aria-label="Income"
        startContent={<BanknoteArrowUp className="text-success" />}
        subtitle={
          <p className="flex">
            2 new incomings <span className="text-success ml-1">fix now</span>
          </p>
        }
        title="Income"
      >
        {JSON.stringify(incomes)}
      </AccordionItem>
      <AccordionItem
        key="2"
        aria-label="Apps Permissions"
        startContent={<HandCoins />}
        subtitle="3 apps have read permissions"
        title="Apps Permissions"
      >
        {defaultContent}
      </AccordionItem>
      <AccordionItem
        key="3"
        aria-label="Pending tasks"
        classNames={{ subtitle: 'text-warning' }}
        startContent={<InfoIcon className="text-warning" />}
        subtitle="Complete your profile"
        title="Pending tasks"
      >
        {defaultContent}
      </AccordionItem>
      <AccordionItem
        key="4"
        aria-label="Card expired"
        classNames={{ subtitle: 'text-danger' }}
        startContent={<BanknoteArrowDown className="text-danger" />}
        subtitle="Please, update now"
        title={<p className="flex gap-1 items-center">Expenses</p>}
      >
        {defaultContent}
      </AccordionItem>
    </Accordion>
  );
}
