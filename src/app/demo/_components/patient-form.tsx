"use client";

import { useState } from "react";

import { type Gender, dispatch, newId, useDemo } from "../_lib/store";
import { Button, Field, Pills, inputClass } from "./ui";

/** Registers a patient and hands back the new id. */
export function PatientForm({
  onCancel,
  onRegistered,
  inBooking,
}: {
  onCancel: () => void;
  onRegistered: (patientId: string, thenBook: boolean) => void;
  inBooking?: boolean;
}) {
  const state = useDemo();
  const [title, setTitle] = useState("Mr");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<Gender>("MALE");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Raipur");
  const [allergies, setAllergies] = useState("");
  const [error, setError] = useState("");

  function submit(thenBook: boolean) {
    if (!firstName.trim() || !lastName.trim())
      return setError("Please enter the patient's first and last name.");
    if (phone.replace(/\D/g, "").length !== 10)
      return setError("Please enter a 10-digit mobile number.");
    if (!age) return setError("Please enter the patient's age.");
    if (!address.trim()) return setError("Please enter the address.");
    const d = new Date();
    const stamp = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
    const todayCount = state.patients.filter((p) =>
      p.uhid.startsWith(`DM${stamp}`),
    ).length;
    const id = newId("p");
    dispatch({
      type: "register",
      patient: {
        id,
        uhid: `DM${stamp}${String(todayCount + 1).padStart(3, "0")}`,
        title,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        age: Number(age),
        gender,
        phone: phone.replace(/\D/g, "").replace(/(\d{5})(\d{5})/, "$1 $2"),
        address: address.trim(),
        city: city.trim() || "Raipur",
        allergies: allergies.trim() || "None",
        skinType: "Not recorded",
        wallet: 0,
      },
    });
    onRegistered(id, thenBook);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(true);
      }}
      className="grid gap-4"
      noValidate
    >
      <div className="grid grid-cols-[100px_1fr_1fr] gap-3">
        <Field label="Title">
          <select
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (["Mrs", "Ms"].includes(e.target.value)) setGender("FEMALE");
              if (["Mr", "Master"].includes(e.target.value)) setGender("MALE");
            }}
            className={inputClass}
          >
            {["Mr", "Mrs", "Ms", "Master", "Baby", "Dr"].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="First name" required>
          <input
            autoFocus
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Last name" required>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <div className="grid grid-cols-[1fr_90px] gap-3 sm:grid-cols-[1fr_90px_auto]">
        <Field label="Mobile number" required>
          <input
            inputMode="numeric"
            placeholder="10-digit mobile"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d ]/g, ""))}
            className={inputClass}
          />
        </Field>
        <Field label="Age" required>
          <input
            inputMode="numeric"
            placeholder="Years"
            value={age}
            onChange={(e) =>
              setAge(e.target.value.replace(/\D/g, "").slice(0, 3))
            }
            className={inputClass}
          />
        </Field>
        <Field label="Gender" required className="col-span-2 sm:col-span-1">
          <Pills
            label="Gender"
            value={gender}
            onChange={(g) => {
              setGender(g);
              if (g === "FEMALE" && ["Mr", "Master"].includes(title))
                setTitle("Ms");
              if (g === "MALE" && ["Mrs", "Ms"].includes(title)) setTitle("Mr");
            }}
            options={[
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
              { value: "OTHER", label: "Other" },
            ]}
          />
        </Field>
      </div>
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
        <Field label="Full address" required>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="City / Town" required>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field
        label="Allergies"
        hint="Shown in red to the doctor during the consultation."
      >
        <input
          placeholder="None"
          value={allergies}
          onChange={(e) => setAllergies(e.target.value)}
          className={inputClass}
        />
      </Field>

      {error && (
        <p
          role="alert"
          className="text-oxblood bg-blush/60 rounded-xl px-3 py-2 text-[13px]"
        >
          {error}
        </p>
      )}

      <div className="mt-2 flex flex-wrap justify-end gap-2">
        <Button onClick={onCancel}>Cancel</Button>
        {inBooking ? (
          <Button type="submit" variant="primary" size="lg">
            Register & Select
          </Button>
        ) : (
          <>
            <Button size="lg" onClick={() => submit(false)}>
              Register only
            </Button>
            <Button type="submit" variant="primary" size="lg">
              Register & Book
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
