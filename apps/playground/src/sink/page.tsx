import { Flex, Separator } from '@fictjs/radix-ui-themes'

import AlertDialogPage from './alert-dialog/page'
import AspectRatioPage from './aspect-ratio/page'
import AvatarPage from './avatar/page'
import BadgePage from './badge/page'
import BlockquotePage from './blockquote/page'
import ButtonPage from './button/page'
import CalloutPage from './callout/page'
import CardPage from './card/page'
import CheckboxCardsPage from './checkbox-cards/page'
import CheckboxGroupPage from './checkbox-group/page'
import CheckboxPage from './checkbox/page'
import CodePage from './code/page'
import ContainerPage from './container/page'
import ContextMenuPage from './context-menu/page'
import CursorsPage from './cursors/page'
import DataListPage from './data-list/page'
import DialogPage from './dialog/page'
import DropdownMenuPage from './dropdown-menu/page'
import GridPage from './grid/page'
import HeadingPage from './heading/page'
import HoverCardPage from './hover-card/page'
import IconButtonPage from './icon-button/page'
import KbdPage from './kbd/page'
import LinkPage from './link/page'
import MixedNestedThemesTestPage from './mixed-nested-themes-test/page'
import NestedAppearancesTestPage from './nested-appearances-test/page'
import NestedColorsTestPage from './nested-colors-test/page'
import PlaygroundPage from './playground/page'
import PopoverPage from './popover/page'
import ProgressPage from './progress/page'
import RadioCardsPage from './radio-cards/page'
import RadioGroupPage from './radio-group/page'
import RadioPage from './radio/page'
import ScrollAreaPage from './scroll-area/page'
import SegmentedControlPage from './segmented-control/page'
import SelectPage from './select/page'
import SeparatorPage from './separator/page'
import ShadowTokensPage from './shadow-tokens/page'
import SkeletonPage from './skeleton/page'
import SliderPage from './slider/page'
import SpinnerPage from './spinner/page'
import SwitchPage from './switch/page'
import TabNavPage from './tab-nav/page'
import TablePage from './table/page'
import TabsPage from './tabs/page'
import TextAreaPage from './text-area/page'
import TextFieldPage from './text-field/page'
import TextPage from './text/page'
import TooltipPage from './tooltip/page'
import TypographyPage from './typography/page'
import type { sinkRoutes } from './routes'

type SinkRoute = (typeof sinkRoutes)[number]['href']

type SinkProps = {
  activeRoute: SinkRoute | undefined
}

const sinkPages = [
  ['alert-dialog', AlertDialogPage],
  ['aspect-ratio', AspectRatioPage],
  ['avatar', AvatarPage],
  ['badge', BadgePage],
  ['blockquote', BlockquotePage],
  ['button', ButtonPage],
  ['callout', CalloutPage],
  ['card', CardPage],
  ['checkbox', CheckboxPage],
  ['checkbox-cards', CheckboxCardsPage],
  ['checkbox-group', CheckboxGroupPage],
  ['code', CodePage],
  ['container', ContainerPage],
  ['context-menu', ContextMenuPage],
  ['cursors', CursorsPage],
  ['data-list', DataListPage],
  ['dialog', DialogPage],
  ['dropdown-menu', DropdownMenuPage],
  ['grid', GridPage],
  ['heading', HeadingPage],
  ['hover-card', HoverCardPage],
  ['icon-button', IconButtonPage],
  ['kbd', KbdPage],
  ['link', LinkPage],
  ['mixed-nested-themes-test', MixedNestedThemesTestPage],
  ['nested-appearances-test', NestedAppearancesTestPage],
  ['nested-colors-test', NestedColorsTestPage],
  ['playground', PlaygroundPage],
  ['popover', PopoverPage],
  ['progress', ProgressPage],
  ['radio', RadioPage],
  ['radio-cards', RadioCardsPage],
  ['radio-group', RadioGroupPage],
  ['scroll-area', ScrollAreaPage],
  ['segmented-control', SegmentedControlPage],
  ['select', SelectPage],
  ['separator', SeparatorPage],
  ['shadow-tokens', ShadowTokensPage],
  ['skeleton', SkeletonPage],
  ['slider', SliderPage],
  ['spinner', SpinnerPage],
  ['switch', SwitchPage],
  ['tab-nav', TabNavPage],
  ['table', TablePage],
  ['tabs', TabsPage],
  ['text', TextPage],
  ['text-area', TextAreaPage],
  ['text-field', TextFieldPage],
  ['tooltip', TooltipPage],
  ['typography', TypographyPage],
] as const satisfies readonly (readonly [SinkRoute, () => unknown])[]

export default function Sink(props: SinkProps) {
  return (
    <div id="root">
      <div
        style={{
          display: 'none',
          position: 'fixed',
          backgroundAttachment: 'fixed',
          inset: 0,
          backgroundSize: '100% max(100%, 600px)',
          backgroundImage: [
            'radial-gradient(at 0% 0%, transparent, transparent)',
            'radial-gradient(at 41% 18%, var(--blue-1) 0, hsla(212, 92%, 67%, 0) 50%)',
            'radial-gradient(at 76% 14%, var(--purple-3) 0, hsla(239, 87%, 67%, 0) 50%)',
            'radial-gradient(at 7% 83%, var(--green-2) 0, hsla(165, 92%, 67%, 0) 50%)',
            'radial-gradient(at 72% 2%, var(--purple-4) 0, hsla(248, 95%, 67%, 0) 50%)',
            'radial-gradient(at 38% 76%, var(--red-3) 0, hsla(23, 86%, 55%, 0) 50%)',
            'radial-gradient(at 88% 24%, var(--green-1) 0, hsla(82, 92%, 68%, 0) 50%)',
            'radial-gradient(at 4% 89%, var(--green-4) 0, hsla(95, 86%, 55%, 0) 50%)',
            'radial-gradient(at 54% 17%, var(--red-3) 0, hsla(2, 93%, 63%, 0) 50%)',
            'radial-gradient(at 65% 86%, var(--red-2) 0, hsla(328, 85%, 64%, 0) 50%)',
            'radial-gradient(at 68% 5%, var(--green-1) 0, hsla(173, 87%, 55%, 0) 50%)',
            'radial-gradient(at 0% 64%, var(--red-1) 0, hsla(8, 90%, 67%, 0) 50%)',
          ].join(', '),
        }}
      />

      <Flex direction="column" gap="6">
        {props.activeRoute === undefined ? (
          <>
            <DialogPage />
            <Separator size="4" />
            <HoverCardPage />
            <Separator size="4" />
            <TooltipPage />
            <Separator size="4" />
            <AlertDialogPage />
            <Separator size="4" />
            <PopoverPage />
            <Separator size="4" />
            <DropdownMenuPage />
            <Separator size="4" />
            <ContextMenuPage />
            <Separator size="4" />
            <SelectPage />
            <Separator size="4" />
            <SwitchPage />
            <Separator size="4" />
            <SliderPage />
            <Separator size="4" />
            <ProgressPage />
            <Separator size="4" />
            <SpinnerPage />
            <Separator size="4" />
            <CheckboxPage />
            <Separator size="4" />
            <CheckboxGroupPage />
            <Separator size="4" />
            <CheckboxCardsPage />
            <Separator size="4" />
            <RadioPage />
            <Separator size="4" />
            <RadioGroupPage />
            <Separator size="4" />
            <RadioCardsPage />
            <Separator size="4" />
            <ButtonPage />
            <Separator size="4" />
            <IconButtonPage />
            <Separator size="4" />
            <TextFieldPage />
            <Separator size="4" />
            <TextAreaPage />
            <Separator size="4" />
            <BadgePage />
            <Separator size="4" />
            <AvatarPage />
            <Separator size="4" />
            <CardPage />
            <Separator size="4" />
            <TablePage />
            <Separator size="4" />
            <TypographyPage />
            <Separator size="4" />
            <TextPage />
            <Separator size="4" />
            <CodePage />
            <Separator size="4" />
            <HeadingPage />
            <Separator size="4" />
            <LinkPage />
            <Separator size="4" />
            <BlockquotePage />
            <Separator size="4" />
            <CalloutPage />
            <Separator size="4" />
            <KbdPage />
            <Separator size="4" />
            <TabNavPage />
            <Separator size="4" />
            <TabsPage />
            <Separator size="4" />
            <AspectRatioPage />
            <Separator size="4" />
            <ScrollAreaPage />
            <Separator size="4" />
            <PlaygroundPage />
            <Separator size="4" />
            <NestedAppearancesTestPage />
            <Separator size="4" />
            <NestedColorsTestPage />
            <Separator size="4" />
            <MixedNestedThemesTestPage />
            <Separator size="4" />
            <ShadowTokensPage />
            <Separator size="4" />
            <GridPage />
            <Separator size="4" />
            <SeparatorPage />
            <Separator size="4" />
            <CursorsPage />
            <Separator size="4" />
            <SkeletonPage />
            <Separator size="4" />
            <DataListPage />
            <Separator size="4" />
            <SegmentedControlPage />
            <Separator size="4" />
            <ContainerPage />
          </>
        ) : (
          sinkPages.map(([route, Page]) => (route === props.activeRoute ? <Page /> : null))
        )}
      </Flex>
    </div>
  )
}
