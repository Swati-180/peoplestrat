import React, { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { employees } from "@/data/mockEmployeeData";
import { Save, Send, User, Briefcase, Clock, Star, TrendingUp, Info } from "lucide-react";
import { FormField } from "@/components/FormField.jsx";

/**
 * EmployeeDataForm
 * 
 * A comprehensive form for collecting employee data points as per UX Pilot specifications.
 * All qualitative inputs are converted to dropdowns with exact wording.
 * All basic organizational fields are now dropdowns derived from mock data.
 */
const EmployeeDataForm = () => {
    const { user } = useAuth();
    const { toast } = useToast();

    // Find the current employee's data or use a fallback
    const currentEmployee = employees.find(e => e.email === user?.email) || employees[0];

    // Derived options from mock data
    const allDepartments = [...new Set(employees.map(e => e.department))].filter(Boolean);
    const allManagers = [...new Set(employees.map(e => e.name))].filter(Boolean);
    const companyNames = ["Tech Corp", "Global Solutions", "Innovate Ltd"];
    const teamMapping = {
        "Finance": ["Accounts Receivable", "Accounts Payable", "General Ledger", "Taxation"],
        "IT": ["Infrastructure", "Software Development", "Cybersecurity", "IT Support"],
        "Engineering": ["Hardware", "DevOps", "R&D"],
        "Analytics": ["Data Science", "Business Intelligence", "Market Research"],
    };

    const [formData, setFormData] = useState({
        // 1. Employee Information
        companyName: "Tech Corp",
        employeeName: currentEmployee.name,
        employeeId: currentEmployee.employeeId,
        department: currentEmployee.department || "Finance",
        currentTeamName: "",
        designation: currentEmployee.position || "Senior Analyst",
        grade: "Grade 2",
        band: "D2",
        location: "Mumbai",
        reportingManager: allManagers[0] || "Ramesh Kumar",
        employmentType: "Full-Time",
        activeRole: "Yes",

        // 2. Role & Process Details
        primaryProcess: "Invoicing",
        secondaryProcess: "None",
        processName: "Global Finance",
        roleDescription: "Individual Contributor",
        processCategory: "Transactional",
        consolidationType: "Consolidated",

        // 3. Experience & Compensation
        totalExperience: currentEmployee.experienceYears || 0,
        experienceInCurrentRole: 2,
        currentCTC: currentEmployee.salary || 0,
        benchmarkCTC: 0,
        ctcBenchmark: "At Median",

        // 4. Fitment - Qualitative Inputs
        pmsRating: "Meets Expectations",
        workComplexity: "The employee role is similar to peers",
        changeReadiness: "Volunteers improvement ideas, uses technology and is open to change",
        customerOrientation: "Knows that win-win relationships start with good listening",
        teamCollaboration: "Appreciates others’ talents and strengths and believes in the power of consensus",
        communication: "Communicates views and seeks alignment",
        selfMotivation: "Is able to work independently with minimal hand-holding",
        certifications: "Additional qualifications / certifications are relevant to the current role",
        locationPreference: "The employee could be amenable to relocate",
        multiplexer: "Is able to juggle multiple responsibilities and adhere to timelines",
        experienceInCurrentRoleQualitative: "Between 5 to 8 years",
        totalWorkExperienceQualitative: "Between 5 to 8 years",

        // 5. Working Hours - Process-wise
        hoursInvoicing: 0,
        hoursCollections: 0,
        hoursPayments: 0,
        hoursR2R: 0,
        hoursTaxation: 0,
        hoursTreasury: 0,
        hoursMeetings: 0,
        hoursTraining: 0,
        hoursOthers: 0,

        // 6. Working Hours - General
        standardWorkingHours: 160,
        actualWorkingHours: 160,
        overtimeHours: 0,
        weekendWork: "No",
        multipleRoles: "No",
        deadlinePressure: "Medium",
    });

    const [touched, setTouched] = useState({});
    
    const getErrors = () => {
        const errors = {};
        if (!formData.currentTeamName) errors.currentTeamName = "Team name is required";
        if (formData.totalExperience < 0) errors.totalExperience = "Experience cannot be negative";
        if (formData.currentCTC < 0) errors.currentCTC = "Salary cannot be negative";
        return errors;
    };

    const formErrors = getErrors();

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveDraft = () => {
        console.log("Saving draft (Raw Data):", formData);
        toast({
            title: "Draft saved successfully",
            description: "Your progress has been saved locally.",
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        setTouched({
            companyName: true,
            currentTeamName: true,
            totalExperience: true,
            currentCTC: true
        });

        if (Object.keys(formErrors).length > 0) {
            toast({
                title: "Form has errors",
                description: "Please check the highlighted fields.",
                variant: "destructive",
            });
            return;
        }

        console.log("Submitting form (Raw Data):", {
            employeeMaster: {
                companyName: formData.companyName,
                employeeName: formData.employeeName,
                employeeId: formData.employeeId,
                department: formData.department,
                currentTeamName: formData.currentTeamName,
                band: formData.band,
                grade: formData.grade,
                designation: formData.designation,
                location: formData.location,
                managerName: formData.reportingManager,
                activeRole: formData.activeRole,
                employmentType: formData.employmentType
            },
            processCharacteristics: {
                primaryProcess: formData.primaryProcess,
                secondaryProcess: formData.secondaryProcess,
                processName: formData.processName,
                roleDescription: formData.roleDescription,
                processCategory: formData.processCategory,
                consolidationType: formData.consolidationType
            },
            experienceCompensation: {
                totalExperience: formData.totalExperience,
                experienceInCurrentRole: formData.experienceInCurrentRole,
                currentCTC: formData.currentCTC,
                benchmarkCTC: formData.benchmarkCTC,
                ctcBenchmark: formData.ctcBenchmark
            },
            fitmentResponses: {
                pmsRating: formData.pmsRating,
                complexityOfWork: formData.workComplexity,
                changeReadyTechSavviness: formData.changeReadiness,
                serviceCustomerOrientation: formData.customerOrientation,
                teamPlayerCollaboration: formData.teamCollaboration,
                locationPreference: formData.locationPreference,
                additionalQualifications: formData.certifications,
                experienceInCurrentRole: formData.experienceInCurrentRoleQualitative,
                totalWorkExperience: formData.totalWorkExperienceQualitative,
                multiplexer: formData.multiplexer,
                communicativeness: formData.communication,
                selfMotivated: formData.selfMotivation
            },
            workingHours: {
                hoursInvoicing: formData.hoursInvoicing,
                hoursCollections: formData.hoursCollections,
                hoursPayments: formData.hoursPayments,
                hoursR2R: formData.hoursR2R,
                hoursTaxation: formData.hoursTaxation,
                hoursTreasury: formData.hoursTreasury,
                hoursMeetings: formData.hoursMeetings,
                hoursTraining: formData.hoursTraining,
                hoursOthers: formData.hoursOthers,
                standardWorkingHours: formData.standardWorkingHours,
                actualWorkingHours: formData.actualWorkingHours,
                overtimeHours: formData.overtimeHours,
                weekendWork: formData.weekendWork,
                multipleRoles: formData.multipleRoles,
                deadlinePressure: formData.deadlinePressure
            }
        });
        toast({
            title: "Employee data submitted successfully",
            description: "Your profile information has been updated.",
        });
    };

    const SectionHeader = ({ icon: Icon, title, description }) => (
        <div className="flex items-center gap-2 mb-6 border-b pb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Icon size={20} />
            </div>
            <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                {description && <p className="text-sm text-muted-foreground">{description}</p>}
            </div>
        </div>
    );

    return (
        <div className="container mx-auto max-w-5xl py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Employee Data Collection Form</h1>
                <p className="text-muted-foreground mt-2">
                    Please provide accurate information for workforce optimization and role fitment analysis.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* 1. Employee Information */}
                <Card className="shadow-sm border-t-4 border-t-primary">
                    <CardHeader>
                        <SectionHeader icon={User} title="1. Employee Information" description="Basic identification and organizational details" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField label="Company Name" required touched={touched.companyName}>
                            <Select value={formData.companyName} onValueChange={(v) => handleSelectChange("companyName", v)}>
                                <SelectTrigger onBlur={() => handleBlur("companyName")}><SelectValue placeholder="Select Company" /></SelectTrigger>
                                <SelectContent>
                                    {companyNames.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Employee Name">
                            <Input value={formData.employeeName} readOnly className="bg-muted" />
                        </FormField>
                        <FormField label="Employee ID">
                            <Input value={formData.employeeId} readOnly className="bg-muted" />
                        </FormField>
                        <FormField label="Department" required touched={touched.department}>
                            <Select value={formData.department} onValueChange={(v) => handleSelectChange("department", v)}>
                                <SelectTrigger onBlur={() => handleBlur("department")}><SelectValue placeholder="Select Department" /></SelectTrigger>
                                <SelectContent>
                                    {allDepartments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <FormField label="Current Team Name" required touched={touched.currentTeamName} error={formErrors.currentTeamName}>
                            <Select value={formData.currentTeamName} onValueChange={(v) => handleSelectChange("currentTeamName", v)}>
                                <SelectTrigger onBlur={() => handleBlur("currentTeamName")}><SelectValue placeholder="Select Team" /></SelectTrigger>
                                <SelectContent>
                                    {(teamMapping[formData.department] || []).map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </FormField>
                        <div className="space-y-2">
                            <Label>Band</Label>
                            <Select value={formData.band} onValueChange={(v) => handleSelectChange("band", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Band" /></SelectTrigger>
                                <SelectContent>
                                    {["D1", "D2", "D3", "M1", "M2"].map(band => <SelectItem key={band} value={band}>{band}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Grade</Label>
                            <Select value={formData.grade} onValueChange={(v) => handleSelectChange("grade", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Grade" /></SelectTrigger>
                                <SelectContent>
                                    {["Grade 1", "Grade 2", "Grade 3", "Grade 4"].map(grade => <SelectItem key={grade} value={grade}>{grade}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Designation</Label>
                            <Select value={formData.designation} onValueChange={(v) => handleSelectChange("designation", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Designation" /></SelectTrigger>
                                <SelectContent>
                                    {["Analyst", "Senior Analyst", "Team Lead", "Manager", "Senior Manager"].map(pos => <SelectItem key={pos} value={pos}>{pos}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Location</Label>
                            <Select value={formData.location} onValueChange={(v) => handleSelectChange("location", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Location" /></SelectTrigger>
                                <SelectContent>
                                    {["Mumbai", "Bangalore", "Pune", "Delhi", "Hyderabad"].map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Manager Name</Label>
                            <Select value={formData.reportingManager} onValueChange={(v) => handleSelectChange("reportingManager", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Manager" /></SelectTrigger>
                                <SelectContent>
                                    {allManagers.map(manager => <SelectItem key={manager} value={manager}>{manager}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Active Role</Label>
                            <Select value={formData.activeRole} onValueChange={(v) => handleSelectChange("activeRole", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Employment Type</Label>
                            <Select value={formData.employmentType} onValueChange={(v) => handleSelectChange("employmentType", v)}>
                                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Full-Time">Full-Time</SelectItem>
                                    <SelectItem value="Contract">Contract</SelectItem>
                                    <SelectItem value="Intern">Intern</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Role & Process Details */}
                <Card className="shadow-sm border-t-4 border-t-indigo-500">
                    <CardHeader>
                        <SectionHeader icon={Briefcase} title="2. Role & Process Details" description="Specifics of your current operational responsibilities" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Primary Process</Label>
                            <Select value={formData.primaryProcess} onValueChange={(v) => handleSelectChange("primaryProcess", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Primary Process" /></SelectTrigger>
                                <SelectContent>
                                    {["Invoicing", "Collections", "Payments", "R2R", "Taxation", "Treasury"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Secondary Process</Label>
                            <Select value={formData.secondaryProcess} onValueChange={(v) => handleSelectChange("secondaryProcess", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Secondary Process" /></SelectTrigger>
                                <SelectContent>
                                    {["None", "Invoicing", "Collections", "Payments", "R2R", "Taxation", "Treasury"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Process Name</Label>
                            <Select value={formData.processName} onValueChange={(v) => handleSelectChange("processName", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Process Name" /></SelectTrigger>
                                <SelectContent>
                                    {["Global Finance", "Local Accounting", "Compliance", "Sales Support"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Current Role Description</Label>
                            <Select value={formData.roleDescription} onValueChange={(v) => handleSelectChange("roleDescription", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Role Description" /></SelectTrigger>
                                <SelectContent>
                                    {["Individual Contributor", "Team Lead", "Project Coordinator", "Support Specialist"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Process Category</Label>
                            <Select value={formData.processCategory} onValueChange={(v) => handleSelectChange("processCategory", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Transactional">Transactional</SelectItem>
                                    <SelectItem value="Accounting">Accounting</SelectItem>
                                    <SelectItem value="Reporting">Reporting</SelectItem>
                                    <SelectItem value="Others">Others</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Consolidation Type</Label>
                            <Select value={formData.consolidationType} onValueChange={(v) => handleSelectChange("consolidationType", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Consolidated">Consolidated</SelectItem>
                                    <SelectItem value="Non-Consolidated">Non-Consolidated</SelectItem>
                                    <SelectItem value="Not Decided">Not Decided</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Experience & Compensation */}
                <Card className="shadow-sm border-t-4 border-t-emerald-500">
                    <CardHeader>
                        <SectionHeader icon={TrendingUp} title="3. Experience & Compensation" description="Professional history and financial benchmarks" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <FormField label="Total Experience (Years)" touched={touched.totalExperience} error={formErrors.totalExperience}>
                            <Input name="totalExperience" type="number" step="0.1" value={formData.totalExperience} onChange={handleChange} onBlur={() => handleBlur("totalExperience")} />
                        </FormField>
                        <FormField label="Exp. in Current Role (Years)" touched={touched.experienceInCurrentRole}>
                            <Input name="experienceInCurrentRole" type="number" step="0.1" value={formData.experienceInCurrentRole} onChange={handleChange} onBlur={() => handleBlur("experienceInCurrentRole")} />
                        </FormField>
                        <FormField label="Current CTC" touched={touched.currentCTC} error={formErrors.currentCTC}>
                            <Input name="currentCTC" type="number" value={formData.currentCTC} onChange={handleChange} onBlur={() => handleBlur("currentCTC")} />
                        </FormField>
                        <FormField label="Benchmark CTC">
                            <Input name="benchmarkCTC" type="number" value={formData.benchmarkCTC} onChange={handleChange} />
                        </FormField>
                        <div className="space-y-2">
                            <Label>CTC Benchmark</Label>
                            <Select value={formData.ctcBenchmark} onValueChange={(v) => handleSelectChange("ctcBenchmark", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Benchmark" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Above Industry">Above Industry</SelectItem>
                                    <SelectItem value="At Median">At Median</SelectItem>
                                    <SelectItem value="Below Industry">Below Industry</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 4. Fitment - Qualitative Inputs */}
                <Card className="shadow-sm border-t-4 border-t-amber-500">
                    <CardHeader>
                        <SectionHeader icon={Star} title="4. Fitment – Qualitative Inputs" description="Self-assessment on soft skills and workplace attributes" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>PMS Rating</Label>
                            <Select value={formData.pmsRating} onValueChange={(v) => handleSelectChange("pmsRating", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Rating" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                                    <SelectItem value="Meets Expectations">Meets Expectations</SelectItem>
                                    <SelectItem value="Exceeds Expectations">Exceeds Expectations</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Complexity of Work</Label>
                            <Select value={formData.workComplexity} onValueChange={(v) => handleSelectChange("workComplexity", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Complexity" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="The employee role is similar to peers">The employee role is similar to peers</SelectItem>
                                    <SelectItem value="The employee role while similar to peers requires more stakeholders to manage">The employee role while similar to peers requires more stakeholders to manage</SelectItem>
                                    <SelectItem value="The employee role while similar to peers requires more stakeholders to manage and more analytical effort">The employee role while similar to peers requires more stakeholders to manage and more analytical effort</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Change Ready & Technology Savviness</Label>
                            <Select value={formData.changeReadiness} onValueChange={(v) => handleSelectChange("changeReadiness", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Altitude" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Believes that if something works it does not need fixing">Believes that if something works it does not need fixing</SelectItem>
                                    <SelectItem value="Needs constant persuasion, explanations and reassurances">Needs constant persuasion, explanations and reassurances</SelectItem>
                                    <SelectItem value="Volunteers improvement ideas, uses technology and is open to change">Volunteers improvement ideas, uses technology and is open to change</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Service & Customer Orientation</Label>
                            <Select value={formData.customerOrientation} onValueChange={(v) => handleSelectChange("customerOrientation", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Orientation" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Believes that out of sight and mind of the customer keeps you generally out of trouble">Believes that out of sight and mind of the customer keeps you generally out of trouble</SelectItem>
                                    <SelectItem value="Seeks to support stakeholders but sometimes ends take precedence over means">Seeks to support stakeholders but sometimes ends take precedence over means</SelectItem>
                                    <SelectItem value="Knows that win-win relationships start with good listening">Knows that win-win relationships start with good listening</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Team Player & Collaboration</Label>
                            <Select value={formData.teamCollaboration} onValueChange={(v) => handleSelectChange("teamCollaboration", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Collaboration Style" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Believes that to keep harmony uncomfortable topics must not be raised">Believes that to keep harmony uncomfortable topics must not be raised</SelectItem>
                                    <SelectItem value="Believes that life is a zero-sum game where to win means someone has to lose">Believes that life is a zero-sum game where to win means someone has to lose</SelectItem>
                                    <SelectItem value="Appreciates others’ talents and strengths and believes in the power of consensus">Appreciates others’ talents and strengths and believes in the power of consensus</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Location Preference</Label>
                            <Select value={formData.locationPreference} onValueChange={(v) => handleSelectChange("locationPreference", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Preference" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="The employee may not be amenable to relocate">The employee may not be amenable to relocate</SelectItem>
                                    <SelectItem value="The employee could be amenable to relocate">The employee could be amenable to relocate</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Additional Qualifications</Label>
                            <Select value={formData.certifications} onValueChange={(v) => handleSelectChange("certifications", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Relevance" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Additional qualifications / certifications are not relevant to the current role">Additional qualifications / certifications are not relevant to the current role</SelectItem>
                                    <SelectItem value="Additional qualifications / certifications are relevant to the current role">Additional qualifications / certifications are relevant to the current role</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Experience in Current Role (Qualitative)</Label>
                            <Select value={formData.experienceInCurrentRoleQualitative} onValueChange={(v) => handleSelectChange("experienceInCurrentRoleQualitative", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Bracket" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="More than 8 years">More than 8 years</SelectItem>
                                    <SelectItem value="Between 5 to 8 years">Between 5 to 8 years</SelectItem>
                                    <SelectItem value="Less than or equal to 5 years">Less than or equal to 5 years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Total Work Experience (Qualitative)</Label>
                            <Select value={formData.totalWorkExperienceQualitative} onValueChange={(v) => handleSelectChange("totalWorkExperienceQualitative", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Bracket" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="More than 8 years">More than 8 years</SelectItem>
                                    <SelectItem value="Between 5 to 8 years">Between 5 to 8 years</SelectItem>
                                    <SelectItem value="Less than or equal to 5 years">Less than or equal to 5 years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Multiplexer</Label>
                            <Select value={formData.multiplexer} onValueChange={(v) => handleSelectChange("multiplexer", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Ability" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Is not able to juggle multiple responsibilities and adhere to timelines">Is not able to juggle multiple responsibilities and adhere to timelines</SelectItem>
                                    <SelectItem value="Is able to juggle multiple responsibilities and adhere to timelines">Is able to juggle multiple responsibilities and adhere to timelines</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Communicativeness</Label>
                            <Select value={formData.communication} onValueChange={(v) => handleSelectChange("communication", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Style" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Does not communicate views and does not seek alignment">Does not communicate views and does not seek alignment</SelectItem>
                                    <SelectItem value="Communicates views and seeks alignment">Communicates views and seeks alignment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Self-Motivated</Label>
                            <Select value={formData.selfMotivation} onValueChange={(v) => handleSelectChange("selfMotivation", v)}>
                                <SelectTrigger><SelectValue placeholder="Select Independency" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Requires constant follow-up, direction and hand-holding">Requires constant follow-up, direction and hand-holding</SelectItem>
                                    <SelectItem value="Is able to work independently with minimal hand-holding">Is able to work independently with minimal hand-holding</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* 5. Working Hours */}
                <Card className="shadow-sm border-t-4 border-t-blue-500">
                    <CardHeader>
                        <SectionHeader icon={Clock} title="5. Working Hours – Process-wise" description="Monthly time allocation" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { id: "hoursInvoicing", label: "Invoicing" },
                            { id: "hoursCollections", label: "Collections" },
                            { id: "hoursPayments", label: "Payments" },
                            { id: "hoursR2R", label: "R2R" },
                            { id: "hoursTaxation", label: "Taxation" },
                            { id: "hoursTreasury", label: "Treasury" },
                            { id: "hoursMeetings", label: "Meetings" },
                            { id: "hoursTraining", label: "Training" },
                            { id: "hoursOthers", label: "Others" },
                        ].map((field) => (
                            <div key={field.id} className="space-y-1">
                                <Label className="text-xs">{field.label}</Label>
                                <Input name={field.id} type="number" value={formData[field.id]} onChange={handleChange} />
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* 6. Working Hours - General */}
                <Card className="shadow-sm border-t-4 border-t-rose-500">
                    <CardHeader>
                        <SectionHeader icon={Info} title="6. Working Hours – General" description="Overall workload indicators" />
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label>Standard Hours</Label>
                            <Input name="standardWorkingHours" type="number" value={formData.standardWorkingHours} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Hours</Label>
                            <Input name="actualWorkingHours" type="number" value={formData.actualWorkingHours} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Overtime</Label>
                            <Input name="overtimeHours" type="number" value={formData.overtimeHours} onChange={handleChange} />
                        </div>
                        <div className="space-y-2">
                            <Label>Weekend Work</Label>
                            <Select value={formData.weekendWork} onValueChange={(v) => handleSelectChange("weekendWork", v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Multiple Roles</Label>
                            <Select value={formData.multipleRoles} onValueChange={(v) => handleSelectChange("multipleRoles", v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Deadline Pressure</Label>
                            <Select value={formData.deadlinePressure} onValueChange={(v) => handleSelectChange("deadlinePressure", v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t pb-10">
                    <Button type="button" variant="outline" size="lg" onClick={handleSaveDraft}>
                        <Save size={18} className="mr-2" />
                        Save Draft
                    </Button>
                    <Button type="submit" size="lg" className="bg-primary hover:bg-primary/90">
                        <Send size={18} className="mr-2" />
                        Submit Form
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default EmployeeDataForm;
