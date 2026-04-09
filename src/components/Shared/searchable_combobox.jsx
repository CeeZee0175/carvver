import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import {
  filterLocationOptions,
  normalizeLocationText,
} from "../../lib/phLocations";
import "./searchable_combobox.css";

const SPRING = { type: "spring", stiffness: 300, damping: 24 };

export default function SearchableCombobox({
  value,
  onSelect,
  options = [],
  placeholder = "Search",
  noResultsText = "No matches found",
  searchHint = "Type to search",
  disabled = false,
  error = false,
  allowCustomValue = false,
  customValueLabel = "Use",
  ariaLabel,
}) {
  const wrapperRef = useRef(null);
  const menuRef = useRef(null);
  const listRef = useRef(null);
  const comboboxId = useId().replace(/:/g, "");
  const listboxId = `${comboboxId}-options`;

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState(null);

  const filteredOptions = useMemo(
    () => filterLocationOptions(query, options),
    [options, query]
  );

  const trimmedQuery = String(query || "").trim();
  const normalizedQuery = normalizeLocationText(trimmedQuery);
  const exactMatch = filteredOptions.some(
    (option) => normalizeLocationText(option) === normalizedQuery
  );
  const showCustomOption = allowCustomValue && trimmedQuery && !exactMatch;
  const totalOptions = filteredOptions.length + (showCustomOption ? 1 : 0);
  const activeOptionId =
    isOpen && highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined;

  useEffect(() => {
    if (!isOpen) {
      setQuery(value || "");
    }
  }, [isOpen, value]);

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    function handlePointerDown(event) {
      const target = event.target;

      if (
        wrapperRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
      setQuery(value || "");
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    setHighlightedIndex(showCustomOption ? 0 : filteredOptions.length === 0 ? -1 : 0);
  }, [filteredOptions.length, isOpen, query, showCustomOption]);

  useEffect(() => {
    if (!isOpen || highlightedIndex < 0 || !listRef.current) return;

    const activeOption = listRef.current.querySelector(
      `[data-combobox-index="${highlightedIndex}"]`
    );

    if (activeOption) {
      activeOption.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !wrapperRef.current || typeof window === "undefined") {
      return undefined;
    }

    const updatePosition = () => {
      if (!wrapperRef.current) return;

      const rect = wrapperRef.current.getBoundingClientRect();
      const margin = 10;
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const availableBelow = viewportHeight - rect.bottom - margin;
      const availableAbove = rect.top - margin;
      const openUpward = availableBelow < 220 && availableAbove > availableBelow;
      const availableHeight = openUpward ? availableAbove : availableBelow;
      const maxHeight = Math.max(140, Math.min(280, availableHeight - 14));
      const width = Math.min(rect.width, viewportWidth - 16);
      const left = Math.max(8, Math.min(rect.left, viewportWidth - width - 8));

      setMenuPosition({
        left,
        width,
        top: openUpward ? undefined : rect.bottom + margin,
        bottom: openUpward ? viewportHeight - rect.top + margin : undefined,
        maxHeight,
      });
    };

    updatePosition();

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => updatePosition())
        : null;

    if (resizeObserver) {
      resizeObserver.observe(wrapperRef.current);
    }

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    window.visualViewport?.addEventListener("resize", updatePosition);
    window.visualViewport?.addEventListener("scroll", updatePosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      window.visualViewport?.removeEventListener("resize", updatePosition);
      window.visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [isOpen]);

  const selectValue = (nextValue) => {
    const normalized = String(nextValue || "").trim();
    onSelect(normalized);
    setQuery(normalized);
    setIsOpen(false);
  };

  const handleKeyDown = (event) => {
    if (disabled) return;

    if (!isOpen && ["ArrowDown", "ArrowUp", "Enter"].includes(event.key)) {
      event.preventDefault();
      setIsOpen(true);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        totalOptions <= 0 ? -1 : Math.min(current + 1, totalOptions - 1)
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) =>
        totalOptions <= 0 ? -1 : Math.max(current - 1, 0)
      );
      return;
    }

    if (event.key === "Enter") {
      if (!isOpen) return;
      event.preventDefault();

      if (showCustomOption && highlightedIndex === 0) {
        selectValue(trimmedQuery);
        return;
      }

      const offsetIndex = showCustomOption ? highlightedIndex - 1 : highlightedIndex;
      if (offsetIndex >= 0 && filteredOptions[offsetIndex]) {
        selectValue(filteredOptions[offsetIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setQuery(value || "");
    }
  };

  const menu =
    isOpen && !disabled && menuPosition
      ? createPortal(
          <AnimatePresence>
            <motion.div
              ref={menuRef}
              className="searchableCombo__menu"
              style={{
                left: menuPosition.left,
                width: menuPosition.width,
                top: menuPosition.top,
                bottom: menuPosition.bottom,
                "--searchable-combo-max-height": `${menuPosition.maxHeight}px`,
              }}
              initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: 4, filter: "blur(6px)" }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <div className="searchableCombo__searchLabel">{searchHint}</div>
              <div
                id={listboxId}
                className="searchableCombo__options"
                ref={listRef}
                role="listbox"
              >
                {showCustomOption ? (
                  <motion.button
                    id={`${listboxId}-option-0`}
                    type="button"
                    className={`searchableCombo__option ${
                      highlightedIndex === 0
                        ? "searchableCombo__option--highlighted"
                        : ""
                    } searchableCombo__option--custom`}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      selectValue(trimmedQuery);
                    }}
                    onMouseEnter={() => setHighlightedIndex(0)}
                    data-combobox-index={0}
                    role="option"
                    aria-selected={false}
                    transition={SPRING}
                  >
                    {customValueLabel} "{trimmedQuery}"
                  </motion.button>
                ) : null}

                {filteredOptions.length === 0 && !showCustomOption ? (
                  <div className="searchableCombo__empty">{noResultsText}</div>
                ) : (
                  filteredOptions.map((option, index) => {
                    const optionIndex = showCustomOption ? index + 1 : index;
                    return (
                      <button
                        key={option}
                        id={`${listboxId}-option-${optionIndex}`}
                        type="button"
                        className={`searchableCombo__option ${
                          optionIndex === highlightedIndex
                            ? "searchableCombo__option--highlighted"
                            : ""
                        } ${
                          option === value ? "searchableCombo__option--selected" : ""
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          selectValue(option);
                        }}
                        onMouseEnter={() => setHighlightedIndex(optionIndex)}
                        data-combobox-index={optionIndex}
                        role="option"
                        aria-selected={option === value}
                      >
                        {option}
                      </button>
                    );
                  })
                )}
              </div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )
      : null;

  return (
    <>
      <div className="searchableCombo" ref={wrapperRef}>
        <div
          className={`searchableCombo__controlWrap ${
            error ? "searchableCombo__controlWrap--error" : ""
          } ${disabled ? "searchableCombo__controlWrap--disabled" : ""}`}
        >
          <input
            className="searchableCombo__control"
            type="text"
            value={isOpen ? query : value || query}
            onFocus={() => {
              if (disabled) return;
              setQuery(value || "");
              setIsOpen(true);
            }}
            onChange={(event) => {
              if (disabled) return;
              setQuery(event.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-expanded={isOpen}
            aria-autocomplete="list"
            aria-label={ariaLabel || placeholder}
            aria-controls={listboxId}
            aria-activedescendant={activeOptionId}
            disabled={disabled}
          />
          <button
            type="button"
            className="searchableCombo__toggle"
            onClick={() => {
              if (disabled) return;
              setQuery(value || "");
              setIsOpen((current) => !current);
            }}
            aria-label={isOpen ? "Close list" : "Open list"}
            disabled={disabled}
          >
            <ChevronDown
              className={`searchableCombo__toggleIcon ${
                isOpen ? "searchableCombo__toggleIcon--open" : ""
              }`}
            />
          </button>
        </div>
      </div>
      {menu}
    </>
  );
}
