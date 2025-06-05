import React, { useState, useRef, useEffect } from "react";
import dayjs, { Dayjs } from "dayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateRangePicker } from "@mui/x-date-pickers-pro/DateRangePicker";
import {
  Box,
  IconButton,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  Paper,
  Dialog,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

const DateRange = () => {
  const [value, setValue] = useState<[Dayjs | null, Dayjs | null]>([
    dayjs().subtract(7, "day"), // Default Start Date (Last 7 Days)
    dayjs(), // Default End Date (Today)
  ]);
  const [open, setOpen] = useState(false);
  const [quickSelect, setQuickSelect] = useState("custom");
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // 🟢 Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // 🟢 Handle Quick Select Changes (Keep Picker Open)
  const handleQuickSelect = (option: string) => {
    setQuickSelect(option);

    let startDate = dayjs();
    if (option === "7days") startDate = dayjs().subtract(7, "day");
    if (option === "1month") startDate = dayjs().subtract(1, "month");
    if (option === "3months") startDate = dayjs().subtract(3, "month");
    if (option === "6months") startDate = dayjs().subtract(6, "month");

    setValue([startDate, dayjs()]);

    // Ensure it stays open when selecting quick options
    setTimeout(() => setOpen(true), 0);
  };

  return (
    <>
      <Box ref={dropdownRef}>
        {/* 🟢 Toggle Button */}
        <IconButton
          onClick={() => setOpen((prev) => !prev)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            border: "1px solid #ccc",
            borderRadius: "6px",
            padding: "6px 12px",

            backgroundColor: "#fff",
          }}
        >
          <CalendarMonthIcon sx={{ color: "#000", fontSize: 18 }} />
          <Typography fontWeight="700" fontSize={{ xs: "12px", sm: "14px" }}>
            Select Date
          </Typography>
          <ArrowDropDownIcon
            sx={{
              color: "#000",
              fontSize: 24,
            }}
          />
        </IconButton>
      </Box>

      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateRangePicker
          value={value}
          onChange={(newValue) => setValue(newValue)}
          open={open}
          onClose={() => setOpen(false)} // Clicking outside closes it
          slotProps={{
            field: { readOnly: true },
            textField: { sx: { display: "none" } },
            desktopPaper: {
              sx: {
                position: "absolute", // Use fixed to center in viewport
                left: { lg: 235 },
                zIndex: 10,
                top: 40,
              },
            },
          }}
        />
      </LocalizationProvider>
      {open ? (
        <Paper
          sx={{
            display: "flex",
            position: "absolute",
            zIndex: 10,
            top: 40,
            height: 320,
            left: 10,
            width: "190px", // Adjust width for side-by-side layout
            borderRadius: "8px",
            boxShadow: 3,
            backgroundColor: "#fff",
            padding: 2,
          }}
        >
          {/* 🟢 Quick Select (Left) */}
          <Box sx={{ width: "200px", borderRight: "1px solid #ddd", pr: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Quick Select
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                value={quickSelect}
                onChange={(e) => handleQuickSelect(e.target.value)}
              >
                <FormControlLabel
                  value="7days"
                  control={<Radio />}
                  label="Last 7 Days"
                />
                <FormControlLabel
                  value="1month"
                  control={<Radio />}
                  label="Last 1 Month"
                />
                <FormControlLabel
                  value="3months"
                  control={<Radio />}
                  label="Last 3 Months"
                />
                <FormControlLabel
                  value="6months"
                  control={<Radio />}
                  label="Last 6 Months"
                />
                <FormControlLabel
                  value="custom"
                  control={<Radio />}
                  label="Custom"
                />
              </RadioGroup>
            </FormControl>
          </Box>
        </Paper>
      ) : null}
    </>
  );
};

export default DateRange;
