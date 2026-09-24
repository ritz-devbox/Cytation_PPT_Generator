import { Fragment } from "react";
import type { PresentationConfig } from "../../domain/models/PresentationConfig";
import type { SlideLayoutResult } from "../../domain/models/SlideDefinition";

interface SlidePreviewProps {
  readonly layout: SlideLayoutResult;
  readonly config: PresentationConfig;
}

function percent(value: number, total: number): string {
  return `${(value / total) * 100}%`;
}

export function SlidePreview({ layout, config }: SlidePreviewProps) {
  if (layout.slides.length === 0) {
    return null;
  }
  return (
    <section className="preview-section" aria-labelledby="preview-title">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Preview</p>
          <h2 id="preview-title">Review the slide preview</h2>
        </div>
        <div className="preview-stats" aria-label="Layout summary">
          <span>{layout.slides.length} slides</span>
          <span>{layout.imagesPerRow} images per row</span>
          <span>{layout.actualDiameter.toFixed(2)} in diameter</span>
        </div>
      </div>
      <div className="slide-list">
        {layout.slides.map((slide) => (
          <article className="preview-card" key={slide.number}>
            <div className="slide-number">Slide {slide.number}</div>
            <div
              className="slide-canvas"
              style={{ aspectRatio: `${config.slideWidth} / ${config.slideHeight}` }}
            >
              {slide.heading && (
                <div
                  className="preview-slide-heading"
                  style={{
                    left: percent(slide.heading.x, config.slideWidth),
                    top: percent(slide.heading.y, config.slideHeight),
                    width: percent(slide.heading.width, config.slideWidth),
                    height: percent(slide.heading.height, config.slideHeight),
                  }}
                >
                  {slide.heading.text}
                </div>
              )}
              {slide.rows.map((row) => (
                <div key={row.key}>
                  <div
                    className="preview-row-label"
                    style={{
                      left: percent(row.labelX, config.slideWidth),
                      top: percent(row.labelY, config.slideHeight),
                      width: percent(row.labelWidth, config.slideWidth),
                      height: percent(row.height, config.slideHeight),
                    }}
                  >
                    {row.label}
                  </div>
                  {row.cells.map((cell) => {
                    const coordinate = `${cell.image.coordinate.row}${cell.image.coordinate.column}`;
                    return (
                      <Fragment key={cell.image.file.id}>
                      <img
                        src={cell.image.file.content ?? ""}
                        alt={`${cell.image.datasetName} ${coordinate}`}
                        title={`${cell.image.datasetName} ${coordinate}`}
                        style={{
                          left: percent(cell.x, config.slideWidth),
                          top: percent(cell.y, config.slideHeight),
                          width: percent(cell.width, config.slideWidth),
                          height: percent(cell.height, config.slideHeight),
                        }}
                      />
                      {cell.annotation &&
                        cell.annotationY !== undefined &&
                        cell.annotationHeight !== undefined && (
                          <span
                            className="preview-cell-annotation"
                            style={{
                              left: percent(cell.x, config.slideWidth),
                              top: percent(cell.annotationY, config.slideHeight),
                              width: percent(cell.width, config.slideWidth),
                              height: percent(cell.annotationHeight, config.slideHeight),
                            }}
                          >
                            {cell.annotation}
                          </span>
                        )}
                      </Fragment>
                    );
                  })}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
