# NIRMAY — SHARED COMPONENT SPECIFICATION & USAGE GUIDE

All shared components are located in `src/components/ui/` and can be imported from `@/components` or `@/components/ui`.

**Rule:** Never use raw hex color strings inside feature components. Use the semantic Tailwind classes (`bg-brand-600`, `text-ink-900`, `border-line-200`, `bg-risk-low-bg`, etc.).

---

## 1. Action & Input Components

### `Button`
```javascript
import { Button } from "@/components";

<Button variant="primary" size="md" onClick={handleClick}>Submit</Button>
<Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>Back</Button>
<Button variant="danger" isLoading={isSubmitting}>Emergency Call</Button>
<Button variant="outline" size="sm">View Details</Button>
```
*Variants:* `primary`, `secondary`, `outline`, `danger`, `ghost`, `subtle`  
*Sizes:* `sm`, `md`, `lg`

### `Input`
```javascript
import { Input } from "@/components";

<Input
  label="Full Name"
  placeholder="Enter patient full name"
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
  required
/>
```

### `Select`
```javascript
import { Select } from "@/components";

<Select
  label="Tobacco Consumption"
  value={tobacco}
  onChange={(e) => setTobacco(e.target.value)}
  options={[
    { value: "none", label: "None" },
    { value: "smokeless", label: "Smokeless (gutkha, khaini)" },
    { value: "smoking", label: "Smoking (bidi, cigarette)" },
    { value: "both", label: "Both" },
  ]}
/>
```

### `Textarea`
```javascript
import { Textarea } from "@/components";

<Textarea
  label="Clinical Review Notes"
  rows={4}
  value={notes}
  onChange={(e) => setNotes(e.target.value)}
/>
```

### `Checkbox`
```javascript
import { Checkbox } from "@/components";

<Checkbox
  label="Betel Quid (Paan)"
  description="Patient regularly consumes paan or areca nut"
  checked={betelQuid}
  onChange={(e) => setBetelQuid(e.target.checked)}
/>
```

### `RadioGroup`
```javascript
import { RadioGroup } from "@/components";

<RadioGroup
  label="Alcohol Consumption"
  name="alcohol"
  value={alcohol}
  onChange={setAlcohol}
  options={[
    { value: "none", label: "None" },
    { value: "occasional", label: "Occasional (1-2 drinks/month)" },
    { value: "regular", label: "Regular (weekly/daily)" },
  ]}
/>
```

### `FileDropzone`
```javascript
import { FileDropzone } from "@/components";

<FileDropzone
  label="Upload Oral Lesion Photo"
  selectedFile={file}
  onFileSelect={(selected) => setFile(selected)}
  onClear={() => setFile(null)}
  guidanceTips={[
    "Ensure bright, even lighting inside the mouth",
    "Focus closely on the lesion or ulcer",
    "Keep camera still to avoid blur",
  ]}
/>
```

---

## 2. Layout & Feedback Components

### `AppShell`
Wraps the page with Navbar, optional role Sidebar, mobile bottom navigation, and Footer.
```javascript
import { AppShell } from "@/components";

export default function Layout({ children }) {
  return (
    <AppShell role="patient" showSidebar={true}>
      {children}
    </AppShell>
  );
}
```

### `PageHeader`
```javascript
import { PageHeader, Button } from "@/components";

<PageHeader
  title="Clinical Case Review"
  description="Case #14 — Submitted 20 minutes ago"
  backHref="/doctor"
  actions={<Button variant="primary">Confirm Risk</Button>}
/>
```

### `RoleGate`
Protects routes on the client side according to user's authenticated role.
```javascript
import { RoleGate } from "@/components";

<RoleGate allowedRoles={["doctor"]}>
  <DoctorQueueView />
</RoleGate>
```

### `Modal`
```javascript
import { Modal, Button } from "@/components";

<Modal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  title="Withdraw Consent"
  description="This will cancel active screening and queue photo deletion."
  footer={
    <>
      <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
      <Button variant="danger" onClick={handleWithdraw}>Withdraw</Button>
    </>
  }
>
  Are you sure you want to withdraw patient consent?
</Modal>
```

### `Card`
```javascript
import { Card } from "@/components";

<Card variant="default">
  <Card.Header>
    <Card.Title>Oral Intake Summary</Card.Title>
    <Card.Description>Reported risk factors</Card.Description>
  </Card.Header>
  <Card.Content>
    Content goes here
  </Card.Content>
  <Card.Footer>
    Actions or status
  </Card.Footer>
</Card>
```

---

## 3. Badges & Clinical Safety Elements

### `RiskBadge`
```javascript
import { RiskBadge } from "@/components";

<RiskBadge risk="High" size="md" />
```

### `UrgencyBadge`
```javascript
import { UrgencyBadge } from "@/components";

<UrgencyBadge urgency="urgent" emergency={false} />
<UrgencyBadge emergency={true} />
```

### `DemoBadge`
```javascript
import { DemoBadge } from "@/components";

<DemoBadge label="demo data" />
```

### `DisclaimerBanner`
```javascript
import { DisclaimerBanner } from "@/components";

<DisclaimerBanner />
```

### `EmergencyBanner`
```javascript
import { EmergencyBanner } from "@/components";

<EmergencyBanner message="Difficulty swallowing or severe bleeding requires immediate emergency care." />
```

### `ReasonsList`
Displays transparent contributing factors determined by the deterministic rules engine.
```javascript
import { ReasonsList } from "@/components";

<ReasonsList reasons={["Tobacco user for 15+ years", "Daily betel quid consumption"]} />
```

### `HeatmapImage`
Displays base photo with toggleable Grad-CAM focus overlay.
```javascript
import { HeatmapImage } from "@/components";

<HeatmapImage
  imageUrl={imageBlobUrl}
  heatmapB64={photoData.heatmap_b64}
  label={photoData.label}
  confidence={photoData.confidence}
  isDemo={photoData.demo_placeholder}
/>
```

### `ExplainPanel`
Invokes the backend explainer service to provide a plain-language summary of structured results.
```javascript
import { ExplainPanel } from "@/components";

<ExplainPanel result={intakeResult} />
```

### `VoiceButton`
Provides speech-to-text input or text-to-speech audio playback.
```javascript
import { VoiceButton } from "@/components";

<VoiceButton mode="input" onTranscription={(text) => handleVoiceInput(text)} />
<VoiceButton mode="speak" textToSpeak="Your risk score is Low." />
```

### `DataTable`
```javascript
import { DataTable, UrgencyBadge } from "@/components";

<DataTable
  columns={[
    { header: "Case ID", key: "case_id" },
    { header: "Patient", key: "patient_name" },
    {
      header: "Urgency",
      render: (_, row) => <UrgencyBadge urgency={row.urgency} emergency={row.emergency} />,
    },
  ]}
  data={cases}
  isLoading={loading}
  onRowClick={(row) => router.push(`/doctor/cases/${row.case_id}`)}
/>
```
