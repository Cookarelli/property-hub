"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { CalendarDays, Check, Clock, Paperclip } from "lucide-react";
import { useDemoState } from "@/lib/demo/store";
import type { MaintenanceRequest } from "@/lib/types";
import {
  maintenanceStatuses,
  statusLabels,
  type ResidentAttachment,
} from "@/lib/resident/schema";
import { formatDate, requestDetails, requestEvents } from "@/lib/resident/data";
import { localAttachmentProvider } from "@/lib/resident/attachments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { personas } from "@/lib/navigation";
export function ResidentStatus({
  status,
}: {
  status: MaintenanceRequest["status"];
}) {
  return (
    <span className={`r-status r-status-${status}`}>
      {statusLabels[status]}
    </span>
  );
}
export function MaintenanceTimeline({
  request,
}: {
  request: MaintenanceRequest;
}) {
  const { state } = useDemoState();
  const events = requestEvents(request, state);
  const active = maintenanceStatuses.indexOf(request.status);
  return (
    <div className="r-timeline">
      <ol className="r-progress" aria-label="Maintenance progress">
        {maintenanceStatuses.map((status, index) => (
          <li
            key={status}
            className={index <= active ? "reached" : ""}
            aria-current={status === request.status ? "step" : undefined}
          >
            <span>{index < active ? <Check size={15} /> : index + 1}</span>
            <strong>{statusLabels[status]}</strong>
          </li>
        ))}
      </ol>
      <h3>Request updates</h3>
      <ol className="r-events">
        {events.map((event) => (
          <li key={event.id}>
            <span className="r-event-dot" />
            <div>
              <div>
                <strong>{statusLabels[event.status]}</strong>
                <time dateTime={event.at}>{formatDate(event.at)}</time>
              </div>
              <p>{event.body}</p>
              {event.scheduledFor && (
                <p className="r-scheduled">
                  <CalendarDays size={15} />
                  {new Intl.DateTimeFormat("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "America/Chicago",
                  }).format(new Date(event.scheduledFor))}{" "}
                  CT
                </p>
              )}
              <small>{event.author}</small>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
export function AttachmentPreview({
  attachment,
}: {
  attachment: ResidentAttachment;
}) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let objectUrl = "";
    localAttachmentProvider
      .load(attachment.key)
      .then((blob) => {
        if (!active) return;
        if (!blob) {
          setError("File is no longer in this browser’s storage.");
          return;
        }
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (active)
          setError("Couldn’t open this attachment. Reload to try again.");
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attachment.key]);
  return (
    <figure className="r-attachment">
      {url && !error ? (
        attachment.mime.startsWith("video/") ? (
          <video
            src={url}
            controls
            preload="metadata"
            aria-label={attachment.name}
            onError={() =>
              setError(
                "This browser cannot preview this video. You can still download it below.",
              )
            }
          />
        ) : (
          <Image
            src={url}
            alt={`Maintenance attachment: ${attachment.name}`}
            width={400}
            height={280}
            unoptimized
            onError={() =>
              setError(
                "This image could not be previewed. You can still download it below.",
              )
            }
          />
        )
      ) : (
        <div className="r-attachment-empty">
          <Paperclip size={20} />
          <p>{error || "Loading attachment…"}</p>
        </div>
      )}
      <figcaption>
        <span>{attachment.name}</span>
        <small>{(attachment.size / 1024 / 1024).toFixed(1)} MB</small>
        {url && (
          <a href={url} download={attachment.name}>
            Download
          </a>
        )}
      </figcaption>
    </figure>
  );
}
export function MaintenanceAccess({
  request,
}: {
  request: MaintenanceRequest;
}) {
  const { state } = useDemoState();
  const details = requestDetails(request, state);
  return (
    <>
      <dl className="r-details">
        <div>
          <dt>Entry permission</dt>
          <dd>
            {request.permission_to_enter
              ? "You may enter while I’m away"
              : "Contact me before entering"}
          </dd>
        </div>
        <div>
          <dt>Pets in the home</dt>
          <dd>
            {details.pets
              ? details.petNotes || "Yes · contact resident for details"
              : "No pets noted"}
          </dd>
        </div>
        <div>
          <dt>Preferred access</dt>
          <dd>
            {details.accessDate ? `${formatDate(details.accessDate)} · ` : ""}
            {details.accessTime}
          </dd>
        </div>
        <div>
          <dt>Contact preference</dt>
          <dd>{details.contactPreference}</dd>
        </div>
      </dl>
      {details.attachments.length > 0 && (
        <div className="r-attachments">
          {details.attachments.map((file) => (
            <AttachmentPreview key={file.id} attachment={file} />
          ))}
        </div>
      )}
    </>
  );
}
export function ManagementMaintenanceActions({
  request,
}: {
  request: MaintenanceRequest;
}) {
  const { state, update } = useDemoState();
  const pathname = usePathname();
  const persona = personas.find((p) => pathname.startsWith(`/demo/${p.id}`));
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  function post(
    status: MaintenanceRequest["status"],
    body: string,
    scheduledFor?: string,
  ) {
    try {
      update({
        maintenanceStatuses: {
          ...state.maintenanceStatuses,
          [request.id]: status,
        },
        maintenanceEvents: [
          ...(state.maintenanceEvents ?? []),
          {
            id: crypto.randomUUID(),
            requestId: request.id,
            status,
            body,
            scheduledFor,
            at: new Date().toISOString(),
            author: persona
              ? `${persona.name} · ${persona.label}`
              : "Community team",
          },
        ],
      });
      setError("");
      setNotice("Update saved to the resident’s timeline.");
    } catch {
      setError(
        "Your update couldn’t be saved in this demo tab. Please try again.",
      );
    }
  }
  return (
    <div className="r-management-actions">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          disabled={
            request.status === "in_progress" || request.status === "completed"
          }
          onClick={() =>
            post(
              "in_progress",
              "We’ve started working on your request. We’ll share another update when the repair is complete.",
            )
          }
        >
          Start work
        </Button>
        <Button
          disabled={request.status === "completed"}
          onClick={() =>
            post(
              "completed",
              "The repair is complete and has been tested. Please let us know if you need anything else.",
            )
          }
        >
          Mark completed
        </Button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          const status = String(
            form.get("status"),
          ) as MaintenanceRequest["status"];
          const day = String(form.get("date") ?? "");
          const time = String(form.get("time") ?? "10:00");
          // Demo calendar visits are restricted to September/October, both Central Daylight Time.
          post(
            status,
            String(form.get("message")).trim(),
            status === "scheduled" ? `${day}T${time}:00-05:00` : undefined,
          );
        }}
      >
        <h3>Share an update with the resident</h3>
        <label>
          Status
          <select
            name="status"
            defaultValue={request.status}
            key={request.status}
          >
            {maintenanceStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <div className="r-form-grid">
          <label>
            Visit date
            <Input
              type="date"
              name="date"
              min="2026-09-17"
              max="2026-10-31"
              defaultValue="2026-09-18"
              required
            />
          </label>
          <label>
            Visit time (Central)
            <Input type="time" name="time" defaultValue="10:00" required />
          </label>
        </div>
        <label>
          Update for resident
          <Textarea
            name="message"
            required
            minLength={5}
            maxLength={2000}
            placeholder="Let your resident know what happens next…"
          />
        </label>
        <Button type="submit" variant="outline">
          <Clock size={15} />
          Post update
        </Button>
        <p className="r-muted">
          Demo update. Appears in this tab’s resident timeline; no notification
          is sent.
        </p>
      </form>
      {error && (
        <p role="alert" className="r-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="r-saved">
          {notice}
        </p>
      )}
    </div>
  );
}
