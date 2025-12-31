import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
	CheckIcon,
	XCircle,
	ChevronDown,
	XIcon,
	WandSparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

/**
 * Animation types and configurations
 */
export interface AnimationConfig {
	/** Badge animation type */
	badgeAnimation?: "bounce" | "pulse" | "wiggle" | "fade" | "slide" | "none";
	/** Popover animation type */
	popoverAnimation?: "scale" | "slide" | "fade" | "flip" | "none";
	/** Option hover animation type */
	optionHoverAnimation?: "highlight" | "scale" | "glow" | "none";
	/** Animation duration in seconds */
	duration?: number;
	/** Animation delay in seconds */
	delay?: number;
}

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva("m-1 transition-all duration-300 ease-in-out", {
	variants: {
		variant: {
			default: "border-foreground/10 text-foreground bg-card hover:bg-card/80",
			secondary:
				"border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
			destructive:
				"border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
			inverted: "inverted",
		},
		badgeAnimation: {
			bounce: "hover:-translate-y-1 hover:scale-110",
			pulse: "hover:animate-pulse",
			wiggle: "hover:animate-wiggle",
			fade: "hover:opacity-80",
			slide: "hover:translate-x-1",
			none: "",
		},
	},
	defaultVariants: {
		variant: "default",
		badgeAnimation: "bounce",
	},
});

/**
 * Option interface for MultiSelect component
 */
interface MultiSelectOption {
	/** The text to display for the option. */
	label: string;
	/** The unique value associated with the option. */
	value: string;
	/** Optional icon component to display alongside the option. */
	icon?: React.ComponentType<{ className?: string }>;
	/** Whether this option is disabled */
	disabled?: boolean;
	/** Custom styling for the option */
	style?: {
		/** Custom badge color */
		badgeColor?: string;
		/** Custom icon color */
		iconColor?: string;
		/** Gradient background for badge */
		gradient?: string;
	};
}

/**
 * Group interface for organizing options
 */
interface OptionGroup {
	/** The label for the group */
	label?: string;
	/** The options in this group */
	options: MultiSelectOption[];
}

/**
 * Props for MultiSelect component
 */
export interface MultiSelectProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof multiSelectVariants> {
	/**
	 * An array of option objects to be displayed in the multi-select component.
	 * Each option object should have a label, value, and an optional icon.
	 */
	options?: MultiSelectOption[];

	/**
	 * An array of group objects for organizing options
	 */
	groups?: OptionGroup[];

	/**
	 * Callback function triggered when the selected values change.
	 * Receives an array of the new selected values.
	 */
	onValueChange?: (value: string[]) => void;

	/** The default selected values when the component mounts. */
	defaultValue?: string[];

	/**
	 * Controlled selected values. When provided, the component operates in controlled mode.
	 */
	value?: string[];

	/**
	 * Placeholder text to be displayed when no values are selected.
	 * Optional, defaults to "Select options".
	 */
	placeholder?: string;

	/**
	 * Animation settings for the multi-select component
	 */
	animation?: AnimationConfig;

	/**
	 * Maximum number of items to be shown in the trigger badge before "+X more"
	 * Optional, defaults to 3.
	 */
	maxCount?: number;

	/**
	 * The modality of the popover. When set to true, interaction with outside elements
	 * will be disabled and only popover content will be visible to screen readers.
	 * Optional, defaults to false.
	 */
	modalPopover?: boolean;

	/**
	 * Specifies the class name to be applied to the popover content.
	 * Optional, if not specified, the default class name is used.
	 */
	popoverClassName?: string;

	/**
	 * If true, renders the multi-select component as a child of another component.
	 * Optional, defaults to false.
	 */
	asChild?: boolean;

	/**
	 * Additional class names to apply custom styles to the multi-select component.
	 * Optional, can be used to add custom styles.
	 */
	className?: string;

	/**
	 * If true, hides the placeholder when values are selected
	 * Optional, defaults to false
	 */
	hidePlaceholderWhenSelected?: boolean;

	/**
	 * Whether to show the clear all button
	 * Optional, defaults to true
	 */
	showClearAll?: boolean;

	/**
	 * Whether to show the select all button
	 * Optional, defaults to false
	 */
	showSelectAll?: boolean;

	/**
	 * Whether to enable search functionality
	 * Optional, defaults to false
	 */
	searchable?: boolean;

	/**
	 * Placeholder text for the search input
	 * Optional, defaults to "Search..."
	 */
	searchPlaceholder?: string;

	/**
	 * Message to display when no search results are found
	 * Optional, defaults to "No results found."
	 */
	emptyMessage?: string;

	/**
	 * Whether the popover is open by default
	 * Optional, defaults to false
	 */
	defaultOpen?: boolean;

	/**
	 * Controlled open state of the popover
	 * Optional
	 */
	open?: boolean;

	/**
	 * Callback when popover open state changes
	 * Optional
	 */
	onOpenChange?: (open: boolean) => void;

	/**
	 * Custom render function for the select/clear all buttons
	 * Optional
	 */
	renderSelectClearButtons?: (
		props: SelectClearButtonsProps
	) => React.ReactNode;

	/**
	 * Whether to disable the multi-select component
	 * Optional, defaults to false
	 */
	disabled?: boolean;

	/**
	 * Custom render function for the trigger badge
	 * Optional
	 */
	renderBadge?: (option: MultiSelectOption) => React.ReactNode;

	/**
	 * Direction to show badges ("row" or "column")
	 * Optional, defaults to "row"
	 */
	badgeDirection?: "row" | "column";

	/**
	 * Maximum height of the popover content
	 * Optional, defaults to "300px"
	 */
	maxHeight?: string;

	/**
	 * Whether to show a border around selected options in the dropdown
	 * Optional, defaults to false
	 */
	showSelectedBorder?: boolean;

	/**
	 * Custom text for the "X more" badge when maxCount is exceeded
	 * Optional, uses default "+ {count} more" format
	 */
	moreLabel?: string;
}

/**
 * Props for the select/clear all buttons render function
 */
interface SelectClearButtonsProps {
	/** Function to select all options */
	selectAll: () => void;
	/** Function to clear all selections */
	clearAll: () => void;
	/** Whether all options are currently selected */
	isAllSelected: boolean;
	/** Whether any options are currently selected */
	hasSelected: boolean;
}

export interface MultiSelectRef {
	/** The currently selected values */
	selectedValues: string[];
	/** Function to update the selected values */
	setSelectedValues: (values: string[]) => void;
	/** Function to open the popover */
	open: () => void;
	/** Function to close the popover */
	close: () => void;
	/** Function to toggle the popover */
	toggle: () => void;
	/** Function to select an option */
	selectOption: (value: string) => void;
	/** Function to deselect an option */
	deselectOption: (value: string) => void;
	/** Function to select all options */
	selectAll: () => void;
	/** Function to clear all selections */
	clearAll: () => void;
}

export const MultiSelect = React.forwardRef<
	MultiSelectRef,
	MultiSelectProps
>(
	(
		{
			options = [],
			groups = [],
			onValueChange,
			variant,
			defaultValue = [],
			value: controlledValue,
			placeholder = "Select options",
			animation,
			maxCount = 3,
			modalPopover = false,
			popoverClassName,
			asChild = false,
			className,
			hidePlaceholderWhenSelected = false,
			showClearAll = true,
			showSelectAll = false,
			searchable = false,
			searchPlaceholder = "Search...",
			emptyMessage = "No results found.",
			defaultOpen = false,
			open: controlledOpen,
			onOpenChange: controlledOnOpenChange,
			renderSelectClearButtons,
			disabled = false,
			renderBadge,
			badgeDirection = "row",
			maxHeight = "300px",
			showSelectedBorder = false,
			moreLabel,
			...props
		},
		ref
	) => {
		const [internalSelectedValues, setInternalSelectedValues] =
			React.useState<string[]>(defaultValue);
		const [isPopoverOpen, setIsPopoverOpen] = React.useState(defaultOpen);
		const [searchTerm, setSearchTerm] = React.useState("");

		// Determine if we're using controlled or uncontrolled value state
		const isValueControlled = controlledValue !== undefined;
		const selectedValues = isValueControlled ? controlledValue : internalSelectedValues;
		const setSelectedValues = React.useCallback(
			(values: string[]) => {
				if (!isValueControlled) {
					setInternalSelectedValues(values);
				}
				onValueChange?.(values);
			},
			[isValueControlled, onValueChange]
		);

		const toggleButtonRef = React.useRef<HTMLButtonElement>(null);

		// Determine if we're using controlled or uncontrolled popover state
		const isControlled = controlledOpen !== undefined;
		const open = isControlled ? controlledOpen : isPopoverOpen;
		const setOpen = React.useCallback(
			(value: boolean) => {
				if (isControlled) {
					controlledOnOpenChange?.(value);
				} else {
					setIsPopoverOpen(value);
				}
			},
			[isControlled, controlledOnOpenChange]
		);

		// Get all options from both flat and grouped structures
		const allOptions = React.useMemo(() => {
			const flatOptions = [...options];
			groups.forEach((group) => {
				flatOptions.push(...group.options);
			});
			return flatOptions;
		}, [options, groups]);

		// Filter options based on search term
		const filteredOptions = React.useMemo(() => {
			if (!searchTerm) return options;
			return options.filter((option) =>
				option.label.toLowerCase().includes(searchTerm.toLowerCase())
			);
		}, [options, searchTerm]);

		// Filter groups based on search term
		const filteredGroups = React.useMemo(() => {
			if (!searchTerm) return groups;
			return groups
				.map((group) => ({
					...group,
					options: group.options.filter((option) =>
						option.label.toLowerCase().includes(searchTerm.toLowerCase())
					),
				}))
				.filter((group) => group.options.length > 0);
		}, [groups, searchTerm]);

		React.useImperativeHandle(
			ref,
			() => ({
				selectedValues,
				setSelectedValues: (values: string[]) => {
					setSelectedValues(values);
					onValueChange?.(values);
				},
				open: () => setOpen(true),
				close: () => setOpen(false),
				toggle: () => setOpen(!open),
				selectOption: (value: string) => {
					if (!selectedValues.includes(value)) {
						const newValues = [...selectedValues, value];
						setSelectedValues(newValues);
						onValueChange?.(newValues);
					}
				},
				deselectOption: (value: string) => {
					const newValues = selectedValues.filter((v) => v !== value);
					setSelectedValues(newValues);
					onValueChange?.(newValues);
				},
				selectAll: () => {
					const allValues = allOptions
						.filter((option) => !option.disabled)
						.map((option) => option.value);
					setSelectedValues(allValues);
					onValueChange?.(allValues);
				},
				clearAll: () => {
					setSelectedValues([]);
					onValueChange?.([]);
				},
			}),
			[selectedValues, open, allOptions, onValueChange, setOpen]
		);

		const handleInputKeyDown = (
			event: React.KeyboardEvent<HTMLInputElement>
		) => {
			if (event.key === "Enter") {
				setOpen(true);
			} else if (event.key === "Backspace" && !event.currentTarget.value) {
				const newSelectedValues = [...selectedValues];
				newSelectedValues.pop();
				setSelectedValues(newSelectedValues);
				onValueChange?.(newSelectedValues);
			}
		};

		const toggleOption = (value: string) => {
			const newSelectedValues = selectedValues.includes(value)
				? selectedValues.filter((v) => v !== value)
				: [...selectedValues, value];
			setSelectedValues(newSelectedValues);
			onValueChange?.(newSelectedValues);
		};

		const handleClear = () => {
			setSelectedValues([]);
			onValueChange?.([]);
		};

		const handleTogglePopover = () => {
			setOpen(!open);
		};

		const handleSelectAll = () => {
			const allValues = allOptions
				.filter((option) => !option.disabled)
				.map((option) => option.value);
			setSelectedValues(allValues);
			onValueChange?.(allValues);
		};

		const clearExtraOptions = () => {
			const newSelectedValues = selectedValues.slice(0, maxCount);
			setSelectedValues(newSelectedValues);
			onValueChange?.(newSelectedValues);
		};

		const toggleAll = () => {
			if (selectedValues.length === allOptions.filter((o) => !o.disabled).length) {
				handleClear();
			} else {
				handleSelectAll();
			}
		};

		const renderOptionItem = (option: MultiSelectOption) => {
			const isSelected = selectedValues.includes(option.value);
			return (
				<CommandItem
					key={option.value}
					onSelect={() => toggleOption(option.value)}
					className={cn(
						"cursor-pointer",
						option.disabled && "cursor-not-allowed opacity-50",
						showSelectedBorder && isSelected && "border-l-2 border-primary",
						animation?.optionHoverAnimation === "highlight" &&
							"hover:bg-accent/50",
						animation?.optionHoverAnimation === "scale" &&
							"hover:scale-[1.02] transition-transform",
						animation?.optionHoverAnimation === "glow" &&
							"hover:shadow-md transition-shadow"
					)}
					disabled={option.disabled}
				>
					<div
						className={cn(
							"mr-2 flex h-4 w-4 !min-w-4 !max-w-4 items-center justify-center rounded-sm border border-primary flex-shrink-0",
							isSelected
								? "bg-primary text-primary-foreground"
								: "opacity-50 [&_svg]:invisible"
						)}
					>
						<CheckIcon className="h-4 w-4" />
					</div>
					{option.icon && (
						<option.icon
							className={cn(
								"mr-2 h-4 w-4",
								option.style?.iconColor && `text-[${option.style.iconColor}]`
							)}
						/>
					)}
					<span className="flex-1">{option.label}</span>
				</CommandItem>
			);
		};

		return (
			<Popover
				open={open}
				onOpenChange={setOpen}
				modal={modalPopover}
			>
				<PopoverTrigger asChild>
					<Button
						ref={toggleButtonRef}
						{...props}
						onClick={handleTogglePopover}
						disabled={disabled}
						className={cn(
							"flex w-full items-center justify-between rounded-md border min-h-10 h-auto bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
							className
						)}
					>
						{selectedValues.length > 0 ? (
							<div
								className={cn(
									"flex w-full items-center justify-between gap-2",
									badgeDirection === "column" && "flex-col items-start"
								)}
							>
								<div
									className={cn(
										"flex flex-wrap items-center gap-1 min-w-0 flex-1",
										badgeDirection === "column" && "flex-col items-start w-full"
									)}
								>
									{!hidePlaceholderWhenSelected && (
										<span className="mr-2 text-muted-foreground">
											{placeholder}
										</span>
									)}
									{selectedValues.slice(0, maxCount).map((value) => {
										const option = allOptions.find((o) => o.value === value);
										if (!option) return null;

										if (renderBadge) {
											return (
												<React.Fragment key={value}>
													{renderBadge(option)}
												</React.Fragment>
											);
										}

										return (
											<Badge
												key={value}
												className={cn(
													multiSelectVariants({
														variant,
														badgeAnimation: animation?.badgeAnimation,
													}),
													option.style?.badgeColor &&
														`bg-[${option.style.badgeColor}]`,
													option.style?.gradient &&
														`bg-gradient-to-r ${option.style.gradient}`
												)}
												style={{
													animationDuration: animation?.duration
														? `${animation.duration}s`
														: undefined,
													animationDelay: animation?.delay
														? `${animation.delay}s`
														: undefined,
												}}
											>
												{option.icon && (
													<option.icon
														className={cn(
															"mr-2 h-4 w-4",
															option.style?.iconColor &&
																`text-[${option.style.iconColor}]`
														)}
													/>
												)}
												{option.label}
												<XCircle
													className="ml-2 h-4 w-4 cursor-pointer"
													onClick={(event) => {
														event.stopPropagation();
														toggleOption(value);
													}}
												/>
											</Badge>
										);
									})}
									{selectedValues.length > maxCount && (
										<Badge
											className={cn(
												multiSelectVariants({
													variant,
													badgeAnimation: animation?.badgeAnimation,
												})
											)}
										>
											{moreLabel || `+ ${selectedValues.length - maxCount} more`}
											<XCircle
												className="ml-2 h-4 w-4 cursor-pointer"
												onClick={(event) => {
													event.stopPropagation();
													clearExtraOptions();
												}}
											/>
										</Badge>
									)}
								</div>
								<div className="flex items-center justify-end gap-1 flex-shrink-0 [&>svg]:!size-4 [&>div]:!w-[2px]">
									<XIcon
										className="h-4 w-4 cursor-pointer text-muted-foreground"
										onClick={(event) => {
											event.stopPropagation();
											handleClear();
										}}
									/>
									<Separator
										orientation="vertical"
										className="flex h-full min-h-6 !w-[2px]"
									/>
									<ChevronDown className="h-4 w-4 cursor-pointer text-muted-foreground" />
								</div>
							</div>
						) : (
							<div className="mx-auto flex w-full items-center justify-between">
								<span className="mx-3 text-sm text-muted-foreground">
									{placeholder}
								</span>
								<ChevronDown className="mx-2 h-4 cursor-pointer text-muted-foreground" />
							</div>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className={cn("w-auto p-0", popoverClassName)}
					align="start"
					onEscapeKeyDown={() => setOpen(false)}
					style={{
						width: toggleButtonRef.current
							? `${toggleButtonRef.current.offsetWidth}px`
							: "auto",
					}}
				>
					<Command>
						{searchable && (
							<CommandInput
								placeholder={searchPlaceholder}
								onKeyDown={handleInputKeyDown}
								value={searchTerm}
								onValueChange={setSearchTerm}
							/>
						)}
						<CommandList style={{ maxHeight }}>
							<CommandEmpty>{emptyMessage}</CommandEmpty>
							{(showSelectAll || showClearAll) && (
								<>
									{renderSelectClearButtons ? (
										renderSelectClearButtons({
											selectAll: handleSelectAll,
											clearAll: handleClear,
											isAllSelected:
												selectedValues.length ===
												allOptions.filter((o) => !o.disabled).length,
											hasSelected: selectedValues.length > 0,
										})
									) : (
										<CommandGroup>
											<div className="flex items-center justify-between px-2 py-1.5">
												{showSelectAll && (
													<Button
														onClick={handleSelectAll}
														variant="ghost"
														size="sm"
														className="h-8 text-xs"
														disabled={
															selectedValues.length ===
															allOptions.filter((o) => !o.disabled).length
														}
													>
														<WandSparkles className="mr-2 h-4 w-4" />
														Select All
													</Button>
												)}
												{showClearAll && selectedValues.length > 0 && (
													<Button
														onClick={handleClear}
														variant="ghost"
														size="sm"
														className="h-8 text-xs"
													>
														<XIcon className="mr-2 h-4 w-4" />
														Clear
													</Button>
												)}
											</div>
										</CommandGroup>
									)}
									<CommandSeparator />
								</>
							)}
							{groups.length > 0 ? (
								<>
									{filteredGroups.map((group, index) => (
										<React.Fragment key={index}>
											<CommandGroup heading={group.label}>
												{group.options.map(renderOptionItem)}
											</CommandGroup>
											{index < filteredGroups.length - 1 && <CommandSeparator />}
										</React.Fragment>
									))}
								</>
							) : (
								<CommandGroup>{filteredOptions.map(renderOptionItem)}</CommandGroup>
							)}
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		);
	}
);

MultiSelect.displayName = "MultiSelect";
