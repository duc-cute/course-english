import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  TextField,
  type AutocompleteRenderGetTagProps,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import { useCallback, useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { muTextFieldSx } from "../../pages/admin/manageUserUiStyles";

const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
const checkedIcon = <CheckBoxIcon fontSize="small" />;

export type FetchPageResult<T> = {
  items: T[];
  total: number;
};

export type FetchPageFn<T> = (args: { page: number; size: number; search: string }) => Promise<FetchPageResult<T>>;

type PagingAutocompleteProps<T> = {
  multiple?: boolean;
  value: T | T[] | null;
  onChange: (value: T | T[] | null) => void;
  fetchPage: FetchPageFn<T>;
  pageSize?: number;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
  getOptionLabel: (option: T) => string;
  getOptionKey: (option: T) => string;
  renderSecondaryLine?: (option: T) => string | null;
};

export function PagingAutocomplete<T>({
  multiple = true,
  value,
  onChange,
  fetchPage,
  pageSize = 20,
  disabled = false,
  error = false,
  helperText,
  placeholder,
  getOptionLabel,
  getOptionKey,
  renderSecondaryLine,
}: PagingAutocompleteProps<T>) {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const requestIdRef = useRef(0);

  const currentValueArray = useMemo<T[]>(() => {
    if (multiple) {
      return (value as T[] | null) ?? [];
    }
    return value ? [value as T] : [];
  }, [multiple, value]);

  const singleValue = multiple ? null : ((currentValueArray[0] as T | undefined) ?? null);

  useEffect(() => {
    if (multiple) return;
    if (singleValue) {
      setSearchInput(getOptionLabel(singleValue));
      return;
    }
    setSearchInput("");
  }, [multiple, singleValue, getOptionLabel]);

  const mergedOptions = useMemo(() => {
    const map = new Map<string, T>();
    [...options, ...currentValueArray].forEach((opt) => {
      const key = getOptionKey(opt);
      if (key) map.set(key, opt);
    });
    return Array.from(map.values());
  }, [options, currentValueArray, getOptionKey]);

  const loadPage = useCallback(
    async (nextPage: number, search: string, append: boolean) => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      try {
        const { items, total: totalCount } = await fetchPage({ page: nextPage, size: pageSize, search });
        if (reqId !== requestIdRef.current) return;

        setTotal(totalCount);
        setHasMore((nextPage + 1) * pageSize < totalCount);
        setPage(nextPage);
        setOptions((prev) => {
          const map = new Map<string, T>();
          (append ? [...prev, ...items] : items).forEach((opt) => {
            const key = getOptionKey(opt);
            if (key) map.set(key, opt);
          });
          return Array.from(map.values());
        });
      } catch {
        if (reqId === requestIdRef.current) {
          if (!append) setOptions([]);
          setHasMore(false);
        }
      } finally {
        if (reqId === requestIdRef.current) setLoading(false);
      }
    },
    [fetchPage, getOptionKey, pageSize],
  );

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void loadPage(0, searchInput, false);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, searchInput, loadPage]);

  const handleListboxScroll = (event: UIEvent<HTMLUListElement>) => {
    const node = event.currentTarget;
    const nearBottom = node.scrollTop + node.clientHeight >= node.scrollHeight - 24;
    if (nearBottom && hasMore && !loading) {
      void loadPage(page + 1, searchInput, true);
    }
  };

  return (
    <Autocomplete
      multiple={multiple}
      disableCloseOnSelect={multiple}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      disabled={disabled}
      loading={loading}
      options={mergedOptions}
      value={multiple ? currentValueArray : singleValue}
      onChange={(_, newValue) => {
        if (multiple) {
          onChange(newValue as T[]);
        } else {
          const selected = (newValue as T | null) ?? null;
          onChange(selected);
          setSearchInput(selected ? getOptionLabel(selected) : "");
        }
      }}
      inputValue={searchInput}
      onInputChange={(_, newInput, reason) => {
        if (reason === "input" || reason === "clear" || reason === "reset") {
          setSearchInput(newInput);
        }
      }}
      slotProps={{
        popper: {
          sx: { zIndex: (theme) => theme.zIndex.modal + 2 },
        },
      }}
      getOptionLabel={(opt) => getOptionLabel(opt)}
      isOptionEqualToValue={(opt, val) => getOptionKey(opt) === getOptionKey(val)}
      filterOptions={(x) => x}
      noOptionsText={loading ? "Đang tải..." : "Không có dữ liệu"}
      ListboxProps={{
        onScroll: handleListboxScroll,
        style: { maxHeight: 220 },
      }}
      renderOption={(props, option, { selected }) => {
        const { key, ...rest } = props;
        const secondary = renderSecondaryLine?.(option);
        return (
          <li key={key} {...rest}>
            {multiple ? (
              <Checkbox icon={icon} checkedIcon={checkedIcon} checked={selected} sx={{ mr: 1, p: 0.25 }} />
            ) : null}
            <Box>
              <Box sx={{ fontSize: 13, fontWeight: 600, color: "#333" }}>{getOptionLabel(option)}</Box>
              {secondary ? (
                <Box sx={{ fontSize: 11, color: "#888780" }}>{secondary}</Box>
              ) : null}
            </Box>
          </li>
        );
      }}
      renderTags={
        multiple
          ? (tagValue, getTagProps) =>
              (tagValue as T[]).map((option, index) => {
          const tagProps = getTagProps({ index }) as ReturnType<AutocompleteRenderGetTagProps>;
          const { key: _tagKey, ...restTagProps } = tagProps;
          return (
            <span
              key={getOptionKey(option)}
              {...restTagProps}
              style={{
                display: "inline-flex",
                alignItems: "center",
                margin: "2px 4px 2px 0",
                padding: "2px 8px",
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 600,
                background: "#E6F1FB",
                color: "#0C447C",
                border: "1px solid #85B7EB",
              }}
            >
              {getOptionLabel(option)}
            </span>
          );
        })
          : undefined
      }
      renderInput={(params) => (
        <TextField
          {...params}
          size="small"
          placeholder={placeholder ?? (currentValueArray.length ? "" : "Chọn...")}
          error={error}
          helperText={
            helperText ??
            (total > 0 ? `Đã tải ${mergedOptions.length}/${total} bản ghi — cuộn để tải thêm` : undefined)
          }
          sx={muTextFieldSx}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={16} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}

