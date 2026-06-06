import CloseIcon from "@mui/icons-material/Close";

import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

import { Box, Button, Drawer, IconButton, Typography } from "@mui/material";

import { useMemo, useState } from "react";

import type { LessonBlockRecord } from "../../shared/api/lesson";

import { getBlockTocTitle, getLessonReaderProTip } from "../lessonReaderUtils";



type LessonReaderTocProps = {

  blocks: LessonBlockRecord[];

  activeBlockId: string | null;

  onSelect: (blockId: string) => void;

  variant: "sidebar" | "mobile";

};



function TocList({

  blocks,

  activeBlockId,

  onSelect,

}: {

  blocks: LessonBlockRecord[];

  activeBlockId: string | null;

  onSelect: (blockId: string) => void;

}) {

  return (

    <nav className="lesson-reader-toc-nav" aria-label="Mục lục bài học">

      <ol className="lesson-reader-toc-list">

        {blocks.map((block, index) => {

          const isActive = block.id === activeBlockId;

          const num = String(index + 1).padStart(2, "0");

          return (

            <li key={block.id}>

              <button

                type="button"

                className={`lesson-reader-toc-item ${isActive ? "active" : ""}`}

                onClick={() => onSelect(block.id)}

                aria-current={isActive ? "true" : undefined}

              >

                <span className="lesson-reader-toc-item-num">{num}</span>

                <span className="lesson-reader-toc-item-title">{getBlockTocTitle(block, index)}</span>

              </button>

            </li>

          );

        })}

      </ol>

    </nav>

  );

}



function TocProgress({ scrollProgress }: { scrollProgress: number }) {

  const pct = Math.round(scrollProgress);

  return (

    <div className="lesson-reader-toc-progress">

      <div className="lesson-reader-toc-progress-label">

        <span>Tiến độ</span>

        <span className="lesson-reader-toc-progress-value">{pct}%</span>

      </div>

      <div className="lesson-reader-toc-progress-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>

        <div className="lesson-reader-toc-progress-fill" style={{ width: `${pct}%` }} />

      </div>

    </div>

  );

}



type LessonReaderTocSidebarProps = Omit<LessonReaderTocProps, "variant"> & {

  scrollProgress?: number;

};



export function LessonReaderTocSidebar({ scrollProgress = 0, ...props }: LessonReaderTocSidebarProps) {

  const proTip = useMemo(() => getLessonReaderProTip(props.blocks), [props.blocks]);

  if (props.blocks.length === 0) return null;



  return (

    <aside className="lesson-reader-toc lesson-reader-toc--sidebar">

      <TocProgress scrollProgress={scrollProgress} />

      <Typography className="lesson-reader-toc-heading" component="h2" variant="subtitle2">

        Mục lục

      </Typography>

      <TocList {...props} />

      <div className="lesson-reader-toc-tip">

        <p className="lesson-reader-toc-tip-label">Gợi ý</p>

        <p className="lesson-reader-toc-tip-text">{proTip}</p>

      </div>

    </aside>

  );

}



export function LessonReaderTocMobile(props: Omit<LessonReaderTocProps, "variant">) {

  const [open, setOpen] = useState(false);

  if (props.blocks.length === 0) return null;



  const handleSelect = (blockId: string) => {

    props.onSelect(blockId);

    setOpen(false);

  };



  return (

    <>

      <Button

        className="lesson-reader-toc-fab"

        variant="contained"

        size="small"

        startIcon={<FormatListBulletedIcon />}

        onClick={() => setOpen(true)}

        aria-label="Mở mục lục"

      >

        Mục lục

      </Button>

      <Drawer

        anchor="bottom"

        open={open}

        onClose={() => setOpen(false)}

        PaperProps={{ className: "lesson-reader-toc-drawer" }}

      >

        <Box sx={{ px: 2, pt: 1.5, pb: 2 }}>

          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>

            <Typography variant="subtitle1" fontWeight={700}>

              Mục lục

            </Typography>

            <IconButton size="small" onClick={() => setOpen(false)} aria-label="Đóng">

              <CloseIcon fontSize="small" />

            </IconButton>

          </Box>

          <TocList blocks={props.blocks} activeBlockId={props.activeBlockId} onSelect={handleSelect} />

        </Box>

      </Drawer>

    </>

  );

}

