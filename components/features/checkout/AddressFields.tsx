"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { WARD_OTHER, type CheckoutFormValues } from "@/lib/validation";
import { listProvinces, listWards } from "@/services/address.service";

const provinces = listProvinces();

/** Tỉnh/Thành → Phường/Xã (đơn vị hành chính 2 cấp), dropdown phụ thuộc nhau. */
export function AddressFields() {
  const {
    register,
    setValue,
    control,
    formState: { errors },
  } = useFormContext<CheckoutFormValues>();
  const provinceId = useWatch({ control, name: "address.provinceId" });
  const wardId = useWatch({ control, name: "address.wardId" });
  const wards = provinceId ? listWards(provinceId) : [];
  const manualWard = wardId === WARD_OTHER;

  const provinceField = register("address.provinceId", {
    onChange: (e) => {
      const next = listWards(e.target.value);
      setValue("address.wardId", e.target.value && next.length === 0 ? WARD_OTHER : "", { shouldValidate: false });
      setValue("address.wardName", "");
    },
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Tỉnh / Thành phố" required error={errors.address?.provinceId?.message}>
        {({ id, describedBy, invalid }) => (
          <Select id={id} aria-describedby={describedBy} invalid={invalid} placeholder="Chọn tỉnh/thành" autoComplete="address-level1" {...provinceField}>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        )}
      </Field>

      {wards.length > 0 ? (
        <Field label="Phường / Xã" required error={errors.address?.wardId?.message}>
          {({ id, describedBy, invalid }) => (
            <Select
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              placeholder={provinceId ? "Chọn phường/xã" : "Chọn tỉnh/thành trước"}
              disabled={!provinceId}
              {...register("address.wardId")}
            >
              {wards.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
              <option value={WARD_OTHER}>Phường/xã khác (tự nhập)</option>
            </Select>
          )}
        </Field>
      ) : (
        <input type="hidden" {...register("address.wardId")} />
      )}

      {(manualWard || (provinceId && wards.length === 0)) && (
        <Field
          label="Tên phường / xã"
          required
          error={errors.address?.wardName?.message ?? (wards.length === 0 ? errors.address?.wardId?.message : undefined)}
          hint="Ví dụ: Phường Bến Thành"
          className={wards.length === 0 ? undefined : "sm:col-span-2"}
        >
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} invalid={invalid} {...register("address.wardName")} />}
        </Field>
      )}

      {!provinceId && (
        <Field label="Phường / Xã" required>
          {({ id }) => <Select id={id} disabled placeholder="Chọn tỉnh/thành trước" />}
        </Field>
      )}

      <Field label="Số nhà, tên đường" required error={errors.address?.street?.message} className="sm:col-span-2">
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} invalid={invalid} autoComplete="street-address" placeholder="Ví dụ: 12 Lê Lợi, tầng 3" {...register("address.street")} />
        )}
      </Field>

      <Field label="Ghi chú cho shipper" optional error={errors.address?.note?.message} className="sm:col-span-2">
        {({ id, describedBy, invalid }) => (
          <Textarea
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            rows={2}
            className="min-h-20"
            placeholder="Ví dụ: Gọi trước 15 phút, giao giờ hành chính, đừng nói là quà nhé!"
            {...register("address.note")}
          />
        )}
      </Field>
    </div>
  );
}
